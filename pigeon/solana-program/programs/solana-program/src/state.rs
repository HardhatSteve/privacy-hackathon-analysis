use anchor_lang::prelude::*;

use crate::constants::MAX_ENCRYPTED_MESSAGE_LEN;

#[account]
pub struct ChatAccount {
    pub participants: [Pubkey; 2],
    pub messages: Vec<DirectMessage>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DirectMessage {
    pub sender: Pubkey,
    pub encrypted_payload: [u8; MAX_ENCRYPTED_MESSAGE_LEN],
    pub payload_len: u16,
    pub timestamp: i64,
}

#[account]
pub struct UserAccount {
    pub encryption_pubkey: Pubkey,
}

