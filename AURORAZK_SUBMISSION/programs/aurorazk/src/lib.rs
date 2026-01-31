use anchor_lang::prelude::*;

declare_id!("4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi");

// ============ Order Fill Types ============

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Default)]
pub enum OrderFillType {
    #[default]
    GTC,  // Good Til Cancelled (default) - partial fills allowed, stays in book
    IOC,  // Immediate or Cancel - partial fills allowed, unfilled portion cancelled
    FOK,  // Fill or Kill - must fill entire order immediately or cancel
    AON,  // All or None - wait until entire order can be filled at once
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum TokenType {
    Sol,
    Usdc,
}

#[program]
pub mod aurorazk {
    use super::*;

    /// Initialize the order book for a specific trading pair
    pub fn initialize(
        ctx: Context<Initialize>,
        base_mint: Pubkey,  // e.g., Native SOL (use system program as placeholder)
        quote_mint: Pubkey, // e.g., USDC
    ) -> Result<()> {
        let order_book = &mut ctx.accounts.order_book;
        order_book.authority = ctx.accounts.authority.key();
        order_book.bump = ctx.bumps.order_book;
        order_book.base_mint = base_mint;
        order_book.quote_mint = quote_mint;
        order_book.total_orders = 0;
        order_book.total_filled = 0;
        order_book.total_volume = 0;
        Ok(())
    }

    /// Place a new order with commitment hash and range proof
    /// The commitment hides the actual price and size
    /// For SOL/USDC: base = SOL amount, quote = USDC price
    pub fn place_order(
        ctx: Context<PlaceOrder>,
        commitment_hash: [u8; 32],
        range_proof: Vec<u8>,
        is_buy: bool,
        expiration: i64, // Unix timestamp when order expires
        fill_type: OrderFillType, // GTC, IOC, FOK, AON
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let order_book = &mut ctx.accounts.order_book;
        let current_time = Clock::get()?.unix_timestamp;
        
        // Validate expiration (must be in future, max 7 days)
        require!(
            expiration > current_time && expiration <= current_time + 7 * 24 * 60 * 60,
            AuroraZkError::InvalidExpiration
        );
        
        order.owner = ctx.accounts.owner.key();
        order.commitment_hash = commitment_hash;
        order.range_proof = range_proof;
        order.is_buy = is_buy;
        order.timestamp = current_time;
        order.expiration = expiration;
        order.filled = false;
        order.cancelled = false;
        order.order_id = order_book.total_orders;
        
        // Initialize partial fill tracking
        order.original_size = 0;  // Set when first revealed
        order.filled_size = 0;
        order.fill_count = 0;
        
        // Set fill type
        order.fill_type = fill_type;
        order.min_fill_size = 0;
        
        order_book.total_orders += 1;
        
        emit!(OrderPlaced {
            order_id: order.order_id,
            owner: order.owner,
            is_buy,
            timestamp: order.timestamp,
            expiration,
        });
        
        Ok(())
    }

    /// Initialize a user balance account (PDA)
    pub fn init_user_balance(ctx: Context<InitUserBalance>) -> Result<()> {
        let balance = &mut ctx.accounts.user_balance;
        balance.owner = ctx.accounts.owner.key();
        balance.bump = ctx.bumps.user_balance;
        balance.sol_balance = 0;
        balance.usdc_balance = 0;
        Ok(())
    }

    /// Record a deposit into the dark pool ledger (on-chain accounting)
    pub fn deposit_dark_pool(
        ctx: Context<UpdateUserBalance>,
        token: TokenType,
        amount: u64,
    ) -> Result<()> {
        let balance = &mut ctx.accounts.user_balance;
        require!(balance.owner == ctx.accounts.owner.key(), AuroraZkError::Unauthorized);
        match token {
            TokenType::Sol => {
                balance.sol_balance = balance
                    .sol_balance
                    .checked_add(amount)
                    .ok_or(AuroraZkError::MathOverflow)?;
            }
            TokenType::Usdc => {
                balance.usdc_balance = balance
                    .usdc_balance
                    .checked_add(amount)
                    .ok_or(AuroraZkError::MathOverflow)?;
            }
        }
        Ok(())
    }

    /// Record a withdrawal from the dark pool ledger (on-chain accounting)
    pub fn withdraw_dark_pool(
        ctx: Context<UpdateUserBalance>,
        token: TokenType,
        amount: u64,
    ) -> Result<()> {
        let balance = &mut ctx.accounts.user_balance;
        require!(balance.owner == ctx.accounts.owner.key(), AuroraZkError::Unauthorized);
        match token {
            TokenType::Sol => {
                require!(balance.sol_balance >= amount, AuroraZkError::InsufficientBalance);
                balance.sol_balance = balance
                    .sol_balance
                    .checked_sub(amount)
                    .ok_or(AuroraZkError::MathOverflow)?;
            }
            TokenType::Usdc => {
                require!(balance.usdc_balance >= amount, AuroraZkError::InsufficientBalance);
                balance.usdc_balance = balance
                    .usdc_balance
                    .checked_sub(amount)
                    .ok_or(AuroraZkError::MathOverflow)?;
            }
        }
        Ok(())
    }

    /// Reveal order details and attempt to match with a counterparty
    /// 
    /// Privacy Model:
    /// - Matcher submits revealed price/size/nonce
    /// - On-chain verification confirms commitment hash matches
    /// - Actual token transfers occur only after verification
    /// 
    /// Arguments:
    /// - buy_price: Revealed buy order price (in micro units, e.g., 95000000 = $95)
    /// - buy_size: Revealed buy order size (in lamports)
    /// - buy_nonce: Nonce used in buy order commitment
    /// - sell_price: Revealed sell order price
    /// - sell_size: Revealed sell order size
    /// - sell_nonce: Nonce used in sell order commitment
    /// - execution_price: Agreed execution price (must be between buy/sell prices)
    /// - execution_size: Agreed execution size (min of both)
    pub fn reveal_and_match(
        ctx: Context<RevealAndMatch>,
        buy_price: u64,
        buy_size: u64,
        buy_nonce: [u8; 32],
        sell_price: u64,
        sell_size: u64,
        sell_nonce: [u8; 32],
        execution_price: u64,
        execution_size: u64,
    ) -> Result<()> {
        let buy_order = &mut ctx.accounts.buy_order;
        let sell_order = &mut ctx.accounts.sell_order;
        let buy_balance = &mut ctx.accounts.buy_balance;
        let sell_balance = &mut ctx.accounts.sell_balance;
        
        // Verify both commitment hashes
        let buy_computed = compute_commitment(buy_price, buy_size, &buy_nonce);
        let sell_computed = compute_commitment(sell_price, sell_size, &sell_nonce);
        
        require!(
            buy_order.commitment_hash == buy_computed,
            AuroraZkError::InvalidCommitment
        );
        
        require!(
            sell_order.commitment_hash == sell_computed,
            AuroraZkError::InvalidCommitment
        );
        
        // Verify orders are valid for matching
        require!(
            !buy_order.filled && !sell_order.filled,
            AuroraZkError::OrderAlreadyFilled
        );
        
        require!(
            !buy_order.cancelled && !sell_order.cancelled,
            AuroraZkError::OrderAlreadyCancelled
        );
        
        // Verify price compatibility (buy_price >= sell_price)
        require!(
            buy_price >= sell_price,
            AuroraZkError::PriceIncompatible
        );
        
        // Verify execution price is within valid range
        require!(
            execution_price >= sell_price && execution_price <= buy_price,
            AuroraZkError::InvalidExecutionPrice
        );
        
        // Verify execution size is valid (min of both order sizes)
        let max_execution_size = std::cmp::min(buy_size, sell_size);
        require!(
            execution_size > 0 && execution_size <= max_execution_size,
            AuroraZkError::InvalidExecutionSize
        );
        
        // Mark orders as filled
        buy_order.filled = true;
        sell_order.filled = true;
        
        // Update order book stats
        let order_book = &mut ctx.accounts.order_book;
        order_book.total_filled += 2;
        order_book.total_volume += execution_size;
        
        emit!(OrderMatched {
            buy_order_id: buy_order.order_id,
            sell_order_id: sell_order.order_id,
            price: execution_price,
            size: execution_size,
            timestamp: Clock::get()?.unix_timestamp,
        });

        // Update per-user dark pool balances (on-chain ledger)
        let quote_amount = compute_quote_amount(execution_price, execution_size)?;

        require!(buy_balance.sol_balance.checked_add(execution_size).is_some(), AuroraZkError::MathOverflow);
        require!(sell_balance.usdc_balance.checked_add(quote_amount).is_some(), AuroraZkError::MathOverflow);
        require!(buy_balance.usdc_balance >= quote_amount, AuroraZkError::InsufficientBalance);
        require!(sell_balance.sol_balance >= execution_size, AuroraZkError::InsufficientBalance);

        buy_balance.sol_balance = buy_balance.sol_balance.saturating_add(execution_size);
        buy_balance.usdc_balance = buy_balance.usdc_balance.saturating_sub(quote_amount);
        sell_balance.sol_balance = sell_balance.sol_balance.saturating_sub(execution_size);
        sell_balance.usdc_balance = sell_balance.usdc_balance.saturating_add(quote_amount);
        
        // Note: Actual token transfers are handled off-chain via ShadowWire
        // The program only records the match and verifies commitments
        // ShadowWire provides private settlement after match is recorded
        
        Ok(())
    }

    /// Cancel an unfilled order
    pub fn cancel_order(ctx: Context<CancelOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;
        
        require!(!order.filled, AuroraZkError::OrderAlreadyFilled);
        require!(!order.cancelled, AuroraZkError::OrderAlreadyCancelled);
        require!(
            order.owner == ctx.accounts.owner.key(),
            AuroraZkError::Unauthorized
        );
        
        order.cancelled = true;
        
        emit!(OrderCancelled {
            order_id: order.order_id,
            owner: order.owner,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Check if an order has expired (can be called by anyone)
    pub fn expire_order(ctx: Context<ExpireOrder>) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(!order.filled, AuroraZkError::OrderAlreadyFilled);
        require!(!order.cancelled, AuroraZkError::OrderAlreadyCancelled);
        require!(current_time > order.expiration, AuroraZkError::OrderExpired);
        
        order.cancelled = true;
        
        emit!(OrderExpired {
            order_id: order.order_id,
            owner: order.owner,
            timestamp: current_time,
        });
        
        Ok(())
    }
    
    /// Close an order account and reclaim rent
    /// Only works for filled or cancelled orders
    /// Rent is returned to the original owner
    pub fn close_order(ctx: Context<CloseOrder>) -> Result<()> {
        let order = &ctx.accounts.order;
        
        // Can only close filled or cancelled orders
        require!(
            order.filled || order.cancelled,
            AuroraZkError::OrderNotCloseable
        );
        
        emit!(OrderClosed {
            order_id: order.order_id,
            owner: order.owner,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        // Account will be closed by Anchor's close constraint
        Ok(())
    }

    /// Partially fill an order
    /// 
    /// This allows matching a portion of an order's size, leaving the rest
    /// available for future matches. Useful for large orders that may
    /// need multiple counterparties.
    /// 
    /// Arguments:
    /// - order_price: Revealed order price (in micro units)
    /// - order_size: Original order size (in lamports) - must match commitment
    /// - order_nonce: Nonce used in order commitment
    /// - fill_size: Amount to fill in this transaction
    /// - execution_price: Price for this fill
    pub fn partial_fill(
        ctx: Context<PartialFill>,
        order_price: u64,
        order_size: u64,
        order_nonce: [u8; 32],
        fill_size: u64,
        execution_price: u64,
    ) -> Result<()> {
        let order = &mut ctx.accounts.order;
        let counterparty_order = &mut ctx.accounts.counterparty_order;
        let order_balance = &mut ctx.accounts.order_balance;
        let counterparty_balance = &mut ctx.accounts.counterparty_balance;
        
        // Verify commitment hash
        let computed = compute_commitment(order_price, order_size, &order_nonce);
        require!(
            order.commitment_hash == computed,
            AuroraZkError::InvalidCommitment
        );
        
        // Verify order is valid for filling
        // Note: We only check the order being filled, NOT the counterparty
        // The counterparty may already be filled (e.g., when sweeping multiple orders)
        // but that doesn't prevent this order from being filled
        require!(!order.filled, AuroraZkError::OrderAlreadyFilled);
        require!(!order.cancelled, AuroraZkError::OrderAlreadyCancelled);
        // Counterparty must not be cancelled (invalid match) but CAN be filled
        require!(!counterparty_order.cancelled, AuroraZkError::OrderAlreadyCancelled);
        
        // Check expiration
        let current_time = Clock::get()?.unix_timestamp;
        require!(current_time <= order.expiration, AuroraZkError::OrderExpired);
        
        // Initialize original_size on first fill if needed
        if order.original_size == 0 {
            order.original_size = order_size;
        }
        
        // Calculate remaining size
        let remaining_size = order.original_size.saturating_sub(order.filled_size);
        require!(remaining_size > 0, AuroraZkError::OrderAlreadyFilled);
        
        // Verify fill size is valid
        require!(fill_size > 0, AuroraZkError::InvalidExecutionSize);
        require!(fill_size <= remaining_size, AuroraZkError::InvalidExecutionSize);
        
        // Update filled amount
        order.filled_size = order.filled_size.saturating_add(fill_size);
        order.fill_count = order.fill_count.saturating_add(1);
        
        // Check if fully filled
        if order.filled_size >= order.original_size {
            order.filled = true;
        }
        
        // Update order book stats
        let order_book = &mut ctx.accounts.order_book;
        order_book.total_volume = order_book.total_volume.saturating_add(fill_size);
        
        // If this completely fills the order, increment total_filled
        if order.filled {
            order_book.total_filled = order_book.total_filled.saturating_add(1);
        }
        
        emit!(PartialFillEvent {
            order_id: order.order_id,
            counterparty_order_id: counterparty_order.order_id,
            fill_size,
            execution_price,
            remaining_size: order.original_size.saturating_sub(order.filled_size),
            fill_count: order.fill_count,
            is_complete: order.filled,
            timestamp: current_time,
        });

        // Update per-user dark pool balances (on-chain ledger)
        let quote_amount = compute_quote_amount(execution_price, fill_size)?;

        if order.is_buy {
            require!(order_balance.usdc_balance >= quote_amount, AuroraZkError::InsufficientBalance);
            require!(counterparty_balance.sol_balance >= fill_size, AuroraZkError::InsufficientBalance);
            order_balance.sol_balance = order_balance.sol_balance.saturating_add(fill_size);
            order_balance.usdc_balance = order_balance.usdc_balance.saturating_sub(quote_amount);
            counterparty_balance.sol_balance = counterparty_balance.sol_balance.saturating_sub(fill_size);
            counterparty_balance.usdc_balance = counterparty_balance.usdc_balance.saturating_add(quote_amount);
        } else {
            require!(order_balance.sol_balance >= fill_size, AuroraZkError::InsufficientBalance);
            require!(counterparty_balance.usdc_balance >= quote_amount, AuroraZkError::InsufficientBalance);
            order_balance.sol_balance = order_balance.sol_balance.saturating_sub(fill_size);
            order_balance.usdc_balance = order_balance.usdc_balance.saturating_add(quote_amount);
            counterparty_balance.sol_balance = counterparty_balance.sol_balance.saturating_add(fill_size);
            counterparty_balance.usdc_balance = counterparty_balance.usdc_balance.saturating_sub(quote_amount);
        }
        
        Ok(())
    }
}

// Helper function to compute commitment hash
fn compute_commitment(price: u64, size: u64, nonce: &[u8; 32]) -> [u8; 32] {
    use anchor_lang::solana_program::hash::hash;
    
    let mut data = Vec::with_capacity(48);
    data.extend_from_slice(&price.to_le_bytes());
    data.extend_from_slice(&size.to_le_bytes());
    data.extend_from_slice(nonce);
    
    hash(&data).to_bytes()
}

fn compute_quote_amount(execution_price: u64, execution_size: u64) -> Result<u64> {
    let numerator = (execution_price as u128)
        .checked_mul(execution_size as u128)
        .ok_or(AuroraZkError::MathOverflow)?;
    let usdc_micro = numerator
        .checked_div(1_000_000_000u128)
        .ok_or(AuroraZkError::MathOverflow)?;
    Ok(u64::try_from(usdc_micro).map_err(|_| AuroraZkError::MathOverflow)?)
}

// ============ Account Contexts ============

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + OrderBook::INIT_SPACE,
        seeds = [b"order_book_v3"],
        bump
    )]
    pub order_book: Account<'info, OrderBook>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceOrder<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Order::INIT_SPACE,
    )]
    pub order: Account<'info, Order>,
    #[account(mut, seeds = [b"order_book_v3"], bump = order_book.bump)]
    pub order_book: Account<'info, OrderBook>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealAndMatch<'info> {
    #[account(mut)]
    pub buy_order: Account<'info, Order>,
    #[account(mut)]
    pub sell_order: Account<'info, Order>,
    #[account(mut, seeds = [b"order_book_v3"], bump = order_book.bump)]
    pub order_book: Account<'info, OrderBook>,
    #[account(
        mut,
        seeds = [b"user_balance", buy_order.owner.as_ref()],
        bump = buy_balance.bump
    )]
    pub buy_balance: Account<'info, UserBalance>,
    #[account(
        mut,
        seeds = [b"user_balance", sell_order.owner.as_ref()],
        bump = sell_balance.bump
    )]
    pub sell_balance: Account<'info, UserBalance>,
    pub matcher: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExpireOrder<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,
    pub caller: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseOrder<'info> {
    #[account(
        mut,
        close = owner,
        constraint = order.owner == owner.key() @ AuroraZkError::Unauthorized
    )]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct PartialFill<'info> {
    #[account(mut)]
    pub order: Account<'info, Order>,
    #[account(mut)]
    pub counterparty_order: Account<'info, Order>,
    #[account(mut, seeds = [b"order_book_v3"], bump = order_book.bump)]
    pub order_book: Account<'info, OrderBook>,
    #[account(
        mut,
        seeds = [b"user_balance", order.owner.as_ref()],
        bump = order_balance.bump
    )]
    pub order_balance: Account<'info, UserBalance>,
    #[account(
        mut,
        seeds = [b"user_balance", counterparty_order.owner.as_ref()],
        bump = counterparty_balance.bump
    )]
    pub counterparty_balance: Account<'info, UserBalance>,
    pub matcher: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitUserBalance<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + UserBalance::INIT_SPACE,
        seeds = [b"user_balance", owner.key().as_ref()],
        bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateUserBalance<'info> {
    #[account(
        mut,
        seeds = [b"user_balance", owner.key().as_ref()],
        bump = user_balance.bump
    )]
    pub user_balance: Account<'info, UserBalance>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

// ============ State Accounts ============

#[account]
#[derive(InitSpace)]
pub struct OrderBook {
    pub authority: Pubkey,
    pub bump: u8,
    pub base_mint: Pubkey,   // Base token (e.g., SOL)
    pub quote_mint: Pubkey,  // Quote token (e.g., USDC)
    pub total_orders: u64,
    pub total_filled: u64,
    pub total_volume: u64,   // Total volume in base units
}

#[account]
#[derive(InitSpace)]
pub struct Order {
    pub owner: Pubkey,
    pub commitment_hash: [u8; 32],
    #[max_len(256)]
    pub range_proof: Vec<u8>,
    pub is_buy: bool,
    pub timestamp: i64,
    pub expiration: i64,     // When the order expires
    pub filled: bool,
    pub cancelled: bool,
    pub order_id: u64,
    // Partial fill tracking
    pub original_size: u64,  // Original order size (in lamports)
    pub filled_size: u64,    // Amount already filled
    pub fill_count: u8,      // Number of partial fills
    // Order fill type
    pub fill_type: OrderFillType,  // GTC, IOC, FOK, AON
    pub min_fill_size: u64,        // Minimum acceptable fill (0 = any)
}

#[account]
#[derive(InitSpace)]
pub struct UserBalance {
    pub owner: Pubkey,
    pub bump: u8,
    pub sol_balance: u64,  // lamports
    pub usdc_balance: u64, // micro USDC (6 decimals)
}

// ============ Events ============

#[event]
pub struct OrderPlaced {
    pub order_id: u64,
    pub owner: Pubkey,
    pub is_buy: bool,
    pub timestamp: i64,
    pub expiration: i64,
}

#[event]
pub struct OrderMatched {
    pub buy_order_id: u64,
    pub sell_order_id: u64,
    pub price: u64,
    pub size: u64,
    pub timestamp: i64,
}

#[event]
pub struct OrderCancelled {
    pub order_id: u64,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OrderExpired {
    pub order_id: u64,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct OrderClosed {
    pub order_id: u64,
    pub owner: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PartialFillEvent {
    pub order_id: u64,
    pub counterparty_order_id: u64,
    pub fill_size: u64,
    pub execution_price: u64,
    pub remaining_size: u64,
    pub fill_count: u8,
    pub is_complete: bool,
    pub timestamp: i64,
}

// ============ Errors ============

#[error_code]
pub enum AuroraZkError {
    #[msg("Invalid commitment hash")]
    InvalidCommitment,
    #[msg("Order has already been filled")]
    OrderAlreadyFilled,
    #[msg("Unauthorized action")]
    Unauthorized,
    #[msg("Invalid range proof")]
    InvalidRangeProof,
    #[msg("Order has expired")]
    OrderExpired,
    #[msg("Invalid expiration time")]
    InvalidExpiration,
    #[msg("Order already cancelled")]
    OrderAlreadyCancelled,
    #[msg("Buy price must be >= sell price for match")]
    PriceIncompatible,
    #[msg("Execution price must be between buy and sell prices")]
    InvalidExecutionPrice,
    #[msg("Execution size must be > 0 and <= min(buy_size, sell_size)")]
    InvalidExecutionSize,
    #[msg("Order must be filled or cancelled before it can be closed")]
    OrderNotCloseable,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Math overflow")]
    MathOverflow,
}
