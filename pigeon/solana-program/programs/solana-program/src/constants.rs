use anchor_lang::prelude::*;

pub const MAX_PLAINTEXT_LEN: usize = 280;
pub const NONCE_LEN: usize = 12;
pub const AUTH_TAG_LEN: usize = 16;
pub const MAX_ENCRYPTED_MESSAGE_LEN: usize = NONCE_LEN + MAX_PLAINTEXT_LEN + AUTH_TAG_LEN; // 308 bytes
pub const MAX_MESSAGES_PER_CHAT: usize = 10;
pub const DIRECT_MESSAGE_SIZE: usize = 32 /* sender pubkey */
    + MAX_ENCRYPTED_MESSAGE_LEN /* encrypted payload */
    + 2 /* payload length */
    + 8; /* timestamp */
pub const CHAT_ACCOUNT_SIZE: usize = 8 /* discriminator */
    + 64 /* participants */
    + 4 /* vec len prefix */
    + (MAX_MESSAGES_PER_CHAT * DIRECT_MESSAGE_SIZE);

pub const USER_ACCOUNT_SIZE: usize = 8 /* discriminator */
    + 32; /* encryption pubkey */

/// Convenience helper for the zeroed participant array
pub fn empty_participants() -> [Pubkey; 2] {
    [Pubkey::default(), Pubkey::default()]
}
