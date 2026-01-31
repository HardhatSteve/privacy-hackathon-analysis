"""AgenC Solana Protocol client.

Python port of @agenc/sdk (TypeScript) at /home/noahm/agenc/sdk/src/.
Provides PDA derivation, task queries, and on-chain account deserialization.

All Solana-specific imports are lazy -- the package works without
solders/solana installed. Only calling Solana functions raises ImportError.
"""

import logging
import struct
from dataclasses import dataclass
from enum import IntEnum
from typing import Optional

logger = logging.getLogger(__name__)

# ============================================================================
# Lazy dependency check
# ============================================================================

_solana_available: Optional[bool] = None


def _check_solana_deps():
    global _solana_available
    if _solana_available is None:
        try:
            import solders  # noqa: F401
            import solana  # noqa: F401

            _solana_available = True
        except ImportError:
            _solana_available = False
    if not _solana_available:
        raise ImportError(
            "solana dependencies not installed. "
            "install with: pip install solders solana"
        )


# ============================================================================
# Constants (ported from sdk/src/constants.ts)
# ============================================================================

PROGRAM_ID_STR = "EopUaCV2svxj9j4hd7KjbrWfdjkspmm2BCBe7jGpKzKZ"
PRIVACY_CASH_PROGRAM_ID_STR = "9fhQBbumKEFuXtMBDw8AaQyAjCorLGJQiS3skWZdQyQD"

DEVNET_RPC = "https://api.devnet.solana.com"
MAINNET_RPC = "https://api.mainnet-beta.solana.com"

# Size constants
HASH_SIZE = 32
RESULT_DATA_SIZE = 64
U64_SIZE = 8
DISCRIMINATOR_SIZE = 8
OUTPUT_FIELD_COUNT = 4

# ZK proof constants
PROOF_SIZE_BYTES = 256
VERIFICATION_COMPUTE_UNITS = 50_000
PUBLIC_INPUTS_COUNT = 67

# Fee constants
PERCENT_BASE = 100
DEFAULT_FEE_PERCENT = 1

# PDA seed bytes (matching sdk/src/constants.ts SEEDS)
SEEDS = {
    "PROTOCOL": b"protocol",
    "TASK": b"task",
    "CLAIM": b"claim",
    "AGENT": b"agent",
    "ESCROW": b"escrow",
    "DISPUTE": b"dispute",
    "VOTE": b"vote",
    "AUTHORITY_VOTE": b"authority_vote",
}


# ============================================================================
# Task state enum (matching sdk/src/constants.ts TaskState)
# ============================================================================


class TaskState(IntEnum):
    """On-chain task status enum."""

    Open = 0
    InProgress = 1
    PendingValidation = 2
    Completed = 3
    Cancelled = 4
    Disputed = 5


_TASK_STATE_NAMES = {
    TaskState.Open: "Open",
    TaskState.InProgress: "In Progress",
    TaskState.PendingValidation: "Pending Validation",
    TaskState.Completed: "Completed",
    TaskState.Cancelled: "Cancelled",
    TaskState.Disputed: "Disputed",
}


def format_task_state(state: TaskState) -> str:
    """Format task state as human-readable string."""
    return _TASK_STATE_NAMES.get(state, "Unknown")


# ============================================================================
# Task account field offsets (ported from sdk/src/queries.ts lines 46-91)
#
# Task account layout:
#   discriminator:          8 bytes  (offset 0)
#   task_id:               32 bytes  (offset 8)
#   creator:               32 bytes  (offset 40)
#   required_capabilities:  8 bytes  (offset 72)
#   description:           64 bytes  (offset 80)
#   constraint_hash:       32 bytes  (offset 144)
#   reward_amount:          8 bytes  (offset 176)
#   max_workers:            1 byte   (offset 184)
#   current_workers:        1 byte   (offset 185)
#   status:                 1 byte   (offset 186)
#   task_type:              1 byte   (offset 187)
#   created_at:             8 bytes  (offset 188)
#   deadline:               8 bytes  (offset 196)
#   completed_at:           8 bytes  (offset 204)
#   escrow:                32 bytes  (offset 212)
#   result:                64 bytes  (offset 244)
#   completions:            1 byte   (offset 308)
#   required_completions:   1 byte   (offset 309)
#   bump:                   1 byte   (offset 310)
#   depends_on:            33 bytes  (offset 311) - Option<Pubkey>
#   dependency_type:        1 byte   (offset 344)
#   _reserved:             32 bytes  (offset 345)
# ============================================================================

TASK_FIELD_OFFSETS = {
    "DISCRIMINATOR": 0,
    "TASK_ID": 8,
    "CREATOR": 40,
    "REQUIRED_CAPABILITIES": 72,
    "DESCRIPTION": 80,
    "CONSTRAINT_HASH": 144,
    "REWARD_AMOUNT": 176,
    "MAX_WORKERS": 184,
    "CURRENT_WORKERS": 185,
    "STATUS": 186,
    "TASK_TYPE": 187,
    "CREATED_AT": 188,
    "DEADLINE": 196,
    "COMPLETED_AT": 204,
    "ESCROW": 212,
    "RESULT": 244,
    "COMPLETIONS": 308,
    "REQUIRED_COMPLETIONS": 309,
    "BUMP": 310,
    "DEPENDS_ON": 311,
    "DEPENDS_ON_PUBKEY": 312,
    "DEPENDENCY_TYPE": 344,
}

# Minimum valid task account size (up to end of dependency_type)
MIN_TASK_ACCOUNT_SIZE = 345


# ============================================================================
# Data types
# ============================================================================


@dataclass
class TaskStatus:
    """Parsed on-chain task data."""

    task_id: int
    state: TaskState
    creator: str  # base58 pubkey
    escrow_lamports: int
    deadline: int
    constraint_hash: Optional[bytes]
    claimed_by: Optional[str]
    completed_at: Optional[int]


# ============================================================================
# PDA derivation (ported from sdk/src/tasks.ts)
# ============================================================================


def _get_program_id():
    _check_solana_deps()
    from solders.pubkey import Pubkey

    return Pubkey.from_string(PROGRAM_ID_STR)


def derive_task_pda(task_id: int, program_id=None):
    """Derive task PDA from task ID.

    Seeds: ["task", u64_le(task_id)]
    Port of deriveTaskPda() in sdk/src/tasks.ts.
    """
    _check_solana_deps()
    from solders.pubkey import Pubkey

    if not isinstance(task_id, int) or task_id < 0:
        raise ValueError("task_id must be a non-negative integer")

    pid = program_id or _get_program_id()
    task_id_bytes = struct.pack("<Q", task_id)
    pda, _bump = Pubkey.find_program_address(
        [SEEDS["TASK"], task_id_bytes],
        pid,
    )
    return pda


def derive_claim_pda(task_pda, agent_pubkey, program_id=None):
    """Derive claim PDA from task and agent.

    Seeds: ["claim", task_pda, agent_pubkey]
    Port of deriveClaimPda() in sdk/src/tasks.ts.
    """
    _check_solana_deps()
    from solders.pubkey import Pubkey

    pid = program_id or _get_program_id()
    pda, _bump = Pubkey.find_program_address(
        [SEEDS["CLAIM"], bytes(task_pda), bytes(agent_pubkey)],
        pid,
    )
    return pda


def derive_escrow_pda(task_pda, program_id=None):
    """Derive escrow PDA from task.

    Seeds: ["escrow", task_pda]
    Port of deriveEscrowPda() in sdk/src/tasks.ts.
    """
    _check_solana_deps()
    from solders.pubkey import Pubkey

    pid = program_id or _get_program_id()
    pda, _bump = Pubkey.find_program_address(
        [SEEDS["ESCROW"], bytes(task_pda)],
        pid,
    )
    return pda


def derive_agent_pda(agent_pubkey, program_id=None):
    """Derive agent registration PDA.

    Seeds: ["agent", agent_pubkey]
    """
    _check_solana_deps()
    from solders.pubkey import Pubkey

    pid = program_id or _get_program_id()
    pda, _bump = Pubkey.find_program_address(
        [SEEDS["AGENT"], bytes(agent_pubkey)],
        pid,
    )
    return pda


def derive_protocol_pda(program_id=None):
    """Derive protocol state PDA.

    Seeds: ["protocol"]
    """
    _check_solana_deps()

    pid = program_id or _get_program_id()
    from solders.pubkey import Pubkey

    pda, _bump = Pubkey.find_program_address(
        [SEEDS["PROTOCOL"]],
        pid,
    )
    return pda


# ============================================================================
# Fee calculation
# ============================================================================


def calculate_escrow_fee(
    escrow_lamports: int, fee_percent: int = DEFAULT_FEE_PERCENT
) -> int:
    """Calculate protocol fee on escrow amount.

    Port of calculateEscrowFee() in sdk/src/tasks.ts.
    """
    if escrow_lamports < 0:
        raise ValueError("escrow_lamports must be non-negative")
    if not (0 <= fee_percent <= PERCENT_BASE):
        raise ValueError(f"fee_percent must be between 0 and {PERCENT_BASE}")
    return (escrow_lamports * fee_percent) // PERCENT_BASE


# ============================================================================
# Task deserialization
# ============================================================================


def _deserialize_task(data: bytes, task_id: int) -> Optional[TaskStatus]:
    """Deserialize raw task account bytes into TaskStatus.

    Byte offsets match sdk/src/queries.ts deserializeTaskAccount().
    """
    _check_solana_deps()
    from solders.pubkey import Pubkey

    if len(data) < MIN_TASK_ACCOUNT_SIZE:
        return None

    o = TASK_FIELD_OFFSETS

    creator_bytes = data[o["CREATOR"] : o["CREATOR"] + 32]
    creator = Pubkey.from_bytes(creator_bytes)

    status_byte = data[o["STATUS"]]
    try:
        state = TaskState(status_byte)
    except ValueError:
        logger.warning("unknown task state: %d", status_byte)
        return None

    reward = struct.unpack_from("<Q", data, o["REWARD_AMOUNT"])[0]
    deadline = struct.unpack_from("<q", data, o["DEADLINE"])[0]
    completed_at_val = struct.unpack_from("<q", data, o["COMPLETED_AT"])[0]

    constraint_hash = data[o["CONSTRAINT_HASH"] : o["CONSTRAINT_HASH"] + 32]
    if constraint_hash == bytes(32):
        constraint_hash = None

    return TaskStatus(
        task_id=task_id,
        state=state,
        creator=str(creator),
        escrow_lamports=reward,
        deadline=deadline,
        constraint_hash=constraint_hash,
        claimed_by=None,
        completed_at=completed_at_val if completed_at_val > 0 else None,
    )


def _deserialize_task_from_raw(data: bytes) -> Optional[TaskStatus]:
    """Deserialize task from raw bytes, extracting task_id from the data."""
    o = TASK_FIELD_OFFSETS
    if len(data) < MIN_TASK_ACCOUNT_SIZE:
        return None

    # Task ID is 32 bytes at offset 8 but we use the first 8 as a numeric ID
    task_id_val = struct.unpack_from("<Q", data, o["TASK_ID"])[0]
    return _deserialize_task(data, task_id_val)


# ============================================================================
# RPC Query Client
# ============================================================================


class AgenCProtocolClient:
    """Read-only client for querying AgenC protocol state on Solana.

    Uses raw RPC calls to avoid Anchor IDL dependency.
    Write operations (create/claim/complete tasks) can be added
    once anchorpy integration is configured.
    """

    def __init__(
        self,
        rpc_url: str = DEVNET_RPC,
        program_id: str = PROGRAM_ID_STR,
    ):
        _check_solana_deps()
        from solana.rpc.api import Client as SolanaClient
        from solders.pubkey import Pubkey

        self.rpc = SolanaClient(rpc_url)
        self.program_id = Pubkey.from_string(program_id)
        logger.info("AgenC protocol client connected to %s", rpc_url)

    def get_task(self, task_id: int) -> Optional[TaskStatus]:
        """Fetch a single task by ID."""
        task_pda = derive_task_pda(task_id, self.program_id)
        resp = self.rpc.get_account_info(task_pda)

        if resp.value is None:
            return None

        data = bytes(resp.value.data)
        return _deserialize_task(data, task_id)

    def get_open_tasks(self, limit: int = 50) -> list[TaskStatus]:
        """Query open tasks using memcmp filter on status byte."""
        from solana.rpc.types import MemcmpOpts

        filters = [
            MemcmpOpts(
                offset=TASK_FIELD_OFFSETS["STATUS"],
                bytes_=bytes([TaskState.Open]),
            )
        ]

        resp = self.rpc.get_program_accounts(
            self.program_id,
            encoding="base64",
            filters=filters,
        )

        tasks = []
        for account_info in resp.value or []:
            try:
                data = bytes(account_info.account.data)
                task = _deserialize_task_from_raw(data)
                if task:
                    tasks.append(task)
            except Exception as exc:
                logger.warning("failed to deserialize task account: %s", exc)

        return tasks[:limit]

    def get_tasks_by_state(
        self, state: TaskState, limit: int = 50
    ) -> list[TaskStatus]:
        """Query tasks by state using memcmp filter."""
        from solana.rpc.types import MemcmpOpts

        filters = [
            MemcmpOpts(
                offset=TASK_FIELD_OFFSETS["STATUS"],
                bytes_=bytes([state]),
            )
        ]

        resp = self.rpc.get_program_accounts(
            self.program_id,
            encoding="base64",
            filters=filters,
        )

        tasks = []
        for account_info in resp.value or []:
            try:
                data = bytes(account_info.account.data)
                task = _deserialize_task_from_raw(data)
                if task:
                    tasks.append(task)
            except Exception as exc:
                logger.warning("failed to deserialize task account: %s", exc)

        return tasks[:limit]
