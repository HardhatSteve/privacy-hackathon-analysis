"""Tests for AgenC Solana protocol client (non-Solana-dependent parts)."""

import struct

import pytest
from agenc_agent.clients.solana import (
    TaskState,
    format_task_state,
    calculate_escrow_fee,
    TASK_FIELD_OFFSETS,
    SEEDS,
    PROGRAM_ID_STR,
    MIN_TASK_ACCOUNT_SIZE,
    PERCENT_BASE,
    _deserialize_task,
)


class TestTaskState:
    def test_enum_values(self):
        assert TaskState.Open == 0
        assert TaskState.InProgress == 1
        assert TaskState.PendingValidation == 2
        assert TaskState.Completed == 3
        assert TaskState.Cancelled == 4
        assert TaskState.Disputed == 5

    def test_format_all_states(self):
        assert format_task_state(TaskState.Open) == "Open"
        assert format_task_state(TaskState.InProgress) == "In Progress"
        assert format_task_state(TaskState.PendingValidation) == "Pending Validation"
        assert format_task_state(TaskState.Completed) == "Completed"
        assert format_task_state(TaskState.Cancelled) == "Cancelled"
        assert format_task_state(TaskState.Disputed) == "Disputed"


class TestFieldOffsets:
    """Verify field offsets match the TypeScript SDK (sdk/src/queries.ts)."""

    def test_discriminator(self):
        assert TASK_FIELD_OFFSETS["DISCRIMINATOR"] == 0

    def test_task_id(self):
        assert TASK_FIELD_OFFSETS["TASK_ID"] == 8

    def test_creator(self):
        assert TASK_FIELD_OFFSETS["CREATOR"] == 40

    def test_required_capabilities(self):
        assert TASK_FIELD_OFFSETS["REQUIRED_CAPABILITIES"] == 72

    def test_description(self):
        assert TASK_FIELD_OFFSETS["DESCRIPTION"] == 80

    def test_constraint_hash(self):
        assert TASK_FIELD_OFFSETS["CONSTRAINT_HASH"] == 144

    def test_reward_amount(self):
        assert TASK_FIELD_OFFSETS["REWARD_AMOUNT"] == 176

    def test_status(self):
        assert TASK_FIELD_OFFSETS["STATUS"] == 186

    def test_deadline(self):
        assert TASK_FIELD_OFFSETS["DEADLINE"] == 196

    def test_completed_at(self):
        assert TASK_FIELD_OFFSETS["COMPLETED_AT"] == 204

    def test_depends_on(self):
        assert TASK_FIELD_OFFSETS["DEPENDS_ON"] == 311

    def test_dependency_type(self):
        assert TASK_FIELD_OFFSETS["DEPENDENCY_TYPE"] == 344

    def test_contiguous_layout(self):
        """Verify layout is internally consistent."""
        # task_id (32 bytes) starts at 8, followed by creator (32 bytes) at 40
        assert TASK_FIELD_OFFSETS["TASK_ID"] + 32 == TASK_FIELD_OFFSETS["CREATOR"]
        # creator (32 bytes) at 40 -> required_capabilities at 72
        assert TASK_FIELD_OFFSETS["CREATOR"] + 32 == TASK_FIELD_OFFSETS["REQUIRED_CAPABILITIES"]
        # required_capabilities (8 bytes) at 72 -> description at 80
        assert TASK_FIELD_OFFSETS["REQUIRED_CAPABILITIES"] + 8 == TASK_FIELD_OFFSETS["DESCRIPTION"]


class TestSeeds:
    def test_seed_values(self):
        assert SEEDS["PROTOCOL"] == b"protocol"
        assert SEEDS["TASK"] == b"task"
        assert SEEDS["CLAIM"] == b"claim"
        assert SEEDS["AGENT"] == b"agent"
        assert SEEDS["ESCROW"] == b"escrow"
        assert SEEDS["DISPUTE"] == b"dispute"
        assert SEEDS["VOTE"] == b"vote"
        assert SEEDS["AUTHORITY_VOTE"] == b"authority_vote"


class TestCalculateEscrowFee:
    def test_standard_fee(self):
        assert calculate_escrow_fee(100_000_000, 1) == 1_000_000

    def test_zero_escrow(self):
        assert calculate_escrow_fee(0) == 0

    def test_zero_fee(self):
        assert calculate_escrow_fee(100_000_000, 0) == 0

    def test_max_fee(self):
        assert calculate_escrow_fee(100, PERCENT_BASE) == 100

    def test_negative_escrow_raises(self):
        with pytest.raises(ValueError, match="non-negative"):
            calculate_escrow_fee(-1)

    def test_invalid_fee_raises(self):
        with pytest.raises(ValueError, match="between 0"):
            calculate_escrow_fee(100, 101)

    def test_integer_division(self):
        # 99 * 1 / 100 = 0 (floor division)
        assert calculate_escrow_fee(99, 1) == 0


class TestConstants:
    def test_program_id_format(self):
        # Base58 encoded, should be 32-44 chars
        assert 32 <= len(PROGRAM_ID_STR) <= 44

    def test_min_account_size(self):
        assert MIN_TASK_ACCOUNT_SIZE == 345
