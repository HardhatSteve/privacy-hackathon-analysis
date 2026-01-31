use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;

// Computation definition offsets for encrypted instructions
const COMP_DEF_OFFSET_ADD_ORDER: u32 = comp_def_offset("add_order");
const COMP_DEF_OFFSET_MATCH_ORDERS: u32 = comp_def_offset("match_orders");
const COMP_DEF_OFFSET_CANCEL_ORDER: u32 = comp_def_offset("cancel_order");
const COMP_DEF_OFFSET_GET_ORDERBOOK_DEPTH: u32 = comp_def_offset("get_orderbook_depth");

declare_id!("DarkPoo1111111111111111111111111111111111111");

#[arcium_program]
pub mod darkpool {
    use super::*;

    // Initialize computation definitions
    pub fn init_add_order_comp_def(ctx: Context<InitAddOrderCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn init_match_orders_comp_def(ctx: Context<InitMatchOrdersCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn init_cancel_order_comp_def(ctx: Context<InitCancelOrderCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    pub fn init_get_orderbook_depth_comp_def(ctx: Context<InitGetOrderbookDepthCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, None, None)?;
        Ok(())
    }

    // Add order to encrypted order book
    pub fn add_order(
        ctx: Context<AddOrder>,
        computation_offset: u64,
        order_price: [u8; 32],
        order_amount: [u8; 32],
        order_side: [u8; 32],
        order_type: [u8; 32],
        user_id: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = ArgBuilder::new()
            .x25519_pubkey(pub_key)
            .plaintext_u128(nonce)
            .encrypted_u64(order_price)
            .encrypted_u64(order_amount)
            .encrypted_u8(order_side)
            .encrypted_u8(order_type)
            .encrypted_u128(user_id)
            .build();

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![AddOrderCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[]
            )?],
            1,
            0,
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "add_order")]
    pub fn add_order_callback(
        ctx: Context<AddOrderCallback>,
        output: SignedComputationOutputs<AddOrderOutput>,
    ) -> Result<()> {
        let _o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account
        ) {
            Ok(AddOrderOutput { field_0 }) => field_0,
            Err(e) => {
                msg!("Error: {}", e);
                return Err(ErrorCode::AbortedComputation.into())
            },
        };

        emit!(OrderAddedEvent {
            computation_offset: ctx.accounts.computation_account.computation_offset,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // Match orders in encrypted order book
    pub fn match_orders(
        ctx: Context<MatchOrders>,
        computation_offset: u64,
    ) -> Result<()> {
        let args = ArgBuilder::new().build();

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![MatchOrdersCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[]
            )?],
            1,
            0,
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "match_orders")]
    pub fn match_orders_callback(
        ctx: Context<MatchOrdersCallback>,
        output: SignedComputationOutputs<MatchOrdersOutput>,
    ) -> Result<()> {
        let o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account
        ) {
            Ok(MatchOrdersOutput { field_0, field_1 }) => (field_0, field_1),
            Err(e) => {
                msg!("Error: {}", e);
                return Err(ErrorCode::AbortedComputation.into())
            },
        };

        emit!(OrdersMatchedEvent {
            computation_offset: ctx.accounts.computation_account.computation_offset,
            match_result: o.1.ciphertexts[0],
            nonce: o.1.nonce.to_le_bytes(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // Cancel order
    pub fn cancel_order(
        ctx: Context<CancelOrder>,
        computation_offset: u64,
        order_id: u64,
        user_id: [u8; 32],
        pub_key: [u8; 32],
        nonce: u128,
    ) -> Result<()> {
        let args = ArgBuilder::new()
            .plaintext_u64(order_id)
            .x25519_pubkey(pub_key)
            .plaintext_u128(nonce)
            .encrypted_u128(user_id)
            .build();

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![CancelOrderCallback::callback_ix(
                computation_offset,
                &ctx.accounts.mxe_account,
                &[]
            )?],
            1,
            0,
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "cancel_order")]
    pub fn cancel_order_callback(
        ctx: Context<CancelOrderCallback>,
        output: SignedComputationOutputs<CancelOrderOutput>,
    ) -> Result<()> {
        let _o = match output.verify_output(
            &ctx.accounts.cluster_account,
            &ctx.accounts.computation_account
        ) {
            Ok(CancelOrderOutput { field_0 }) => field_0,
            Err(e) => {
                msg!("Error: {}", e);
                return Err(ErrorCode::AbortedComputation.into())
            },
        };

        emit!(OrderCancelledEvent {
            computation_offset: ctx.accounts.computation_account.computation_offset,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

// Events
#[event]
pub struct OrderAddedEvent {
    pub computation_offset: u64,
    pub timestamp: i64,
}

#[event]
pub struct OrdersMatchedEvent {
    pub computation_offset: u64,
    pub match_result: [u8; 32],
    pub nonce: [u8; 16],
    pub timestamp: i64,
}

#[event]
pub struct OrderCancelledEvent {
    pub computation_offset: u64,
    pub timestamp: i64,
}

// Account structures (auto-generated by Arcium)
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitAddOrderCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitMatchOrdersCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitCancelOrderCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitGetOrderbookDepthCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct AddOrder<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddOrderCallback<'info> {
    pub cluster_account: AccountInfo<'info>,
    pub computation_account: AccountInfo<'info>,
    pub mxe_account: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct MatchOrders<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MatchOrdersCallback<'info> {
    pub cluster_account: AccountInfo<'info>,
    pub computation_account: AccountInfo<'info>,
    pub mxe_account: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct CancelOrder<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelOrderCallback<'info> {
    pub cluster_account: AccountInfo<'info>,
    pub computation_account: AccountInfo<'info>,
    pub mxe_account: AccountInfo<'info>,
}
