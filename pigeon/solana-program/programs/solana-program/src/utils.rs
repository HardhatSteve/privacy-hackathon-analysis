use anchor_lang::prelude::*;
use core::convert::TryFrom;

use crate::constants::{empty_participants, MAX_ENCRYPTED_MESSAGE_LEN, MAX_MESSAGES_PER_CHAT};
use crate::errors::ChatError;
use crate::state::{ChatAccount, DirectMessage};

/// Returns the two public keys ordered lexicographically.
pub fn ordered_keys(a: &Pubkey, b: &Pubkey) -> (Pubkey, Pubkey) {
    if a.as_ref() <= b.as_ref() {
        (*a, *b)
    } else {
        (*b, *a)
    }
}

/// Validates encrypted payload length and returns the value as `u16`.
pub fn validate_encrypted_payload(encrypted_text: &[u8]) -> Result<u16> {
    let encrypted_len = encrypted_text.len();
    require!(encrypted_len <= MAX_ENCRYPTED_MESSAGE_LEN, ChatError::MessageTooLong);
    require!(encrypted_len > 0, ChatError::EmptyMessage);
    u16::try_from(encrypted_len).map_err(|_| error!(ChatError::MessageTooLong))
}

pub fn ensure_chat_capacity(_chat_account: &ChatAccount) -> Result<()> {
    // Capacity check removed because we now use rolling buffer
    Ok(())
}


/// Ensures the passed accounts are in canonical order.
pub fn ensure_canonical_accounts(participant_a: &Pubkey, participant_b: &Pubkey) -> Result<()> {
    require!(participant_a.as_ref() <= participant_b.as_ref(), ChatError::InvalidParticipants);
    Ok(())
}

/// Validates that the authority is one of the participants.
pub fn ensure_signer_is_participant(authority: &Signer, first: &Pubkey, second: &Pubkey) -> Result<()> {
    let key = authority.key();
    require!(key == *first || key == *second, ChatError::UnauthorizedSender);
    Ok(())
}

/// Initializes the chat participants on first write and validates subsequent calls.
pub fn initialize_participants(chat_account: &mut ChatAccount, first: Pubkey, second: Pubkey) -> Result<()> {
    if chat_account.participants == empty_participants() {
        chat_account.participants = [first, second];
        return Ok(());
    }

    require!(chat_account.participants == [first, second], ChatError::InvalidParticipants);
    Ok(())
}

/// Clears legacy message layouts to prevent corrupt state.
pub fn sanitize_legacy_messages(chat_account: &mut ChatAccount) {
    if chat_account
        .messages
        .iter()
        .any(|msg| msg.payload_len == 0 || (msg.payload_len as usize) > MAX_ENCRYPTED_MESSAGE_LEN)
    {
        msg!("Detected legacy chat layout, resetting stored messages");
        chat_account.messages.clear();
    }
}

/// Copies the encrypted payload into a fixed-size buffer used on-chain.
pub fn copy_encrypted_payload(encrypted_text: &[u8]) -> [u8; MAX_ENCRYPTED_MESSAGE_LEN] {
    let mut payload = [0u8; MAX_ENCRYPTED_MESSAGE_LEN];
    let len = encrypted_text.len();
    payload[..len].copy_from_slice(encrypted_text);
    payload
}

/// Appends a direct message to the chat account with the current timestamp.
pub fn push_direct_message(
    chat_account: &mut ChatAccount,
    sender: Pubkey,
    encrypted_payload: [u8; MAX_ENCRYPTED_MESSAGE_LEN],
    payload_len: u16,
) -> Result<()> {
    let timestamp = Clock::get()?.unix_timestamp;
    
    if chat_account.messages.len() >= MAX_MESSAGES_PER_CHAT {
        chat_account.messages.remove(0);
    }

    chat_account.messages.push(DirectMessage {
        sender,
        encrypted_payload,
        payload_len,
        timestamp,
    });
    Ok(())
}
