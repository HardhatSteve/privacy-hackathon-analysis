use anchor_lang::prelude::*;

#[error_code]
pub enum ChatError {
    #[msg("Message too long!")]
    MessageTooLong,
    #[msg("Message cannot be empty!")]
    EmptyMessage,
    #[msg("Chat is full! Maximum 10 messages reached.")]
    ChatFull,
    #[msg("Chat participants do not match expected addresses.")]
    InvalidParticipants,
    #[msg("Only chat participants can send messages.")]
    UnauthorizedSender,
}
