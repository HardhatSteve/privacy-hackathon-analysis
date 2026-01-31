use anchor_lang::prelude::*;

use crate::utils::{
    copy_encrypted_payload,
    ensure_canonical_accounts,
    ensure_chat_capacity,
    ensure_signer_is_participant,
    initialize_participants,
    ordered_keys,
    push_direct_message,
    sanitize_legacy_messages,
    validate_encrypted_payload,
};
use crate::SendDm;

pub fn handler(ctx: Context<SendDm>, encrypted_text: Vec<u8>) -> Result<()> {
    let chat_account = &mut ctx.accounts.chat_account;
    let authority = &ctx.accounts.authority;
    let participant_a_key = ctx.accounts.participant_a.key();
    let participant_b_key = ctx.accounts.participant_b.key();

    let payload_len = validate_encrypted_payload(&encrypted_text)?;
    ensure_chat_capacity(chat_account)?;
    ensure_canonical_accounts(&participant_a_key, &participant_b_key)?;

    let (first, second) = ordered_keys(&participant_a_key, &participant_b_key);
    ensure_signer_is_participant(authority, &first, &second)?;
    initialize_participants(chat_account, first, second)?;

    sanitize_legacy_messages(chat_account);
    let payload = copy_encrypted_payload(&encrypted_text);
    push_direct_message(chat_account, authority.key(), payload, payload_len)?;

    Ok(())
}
