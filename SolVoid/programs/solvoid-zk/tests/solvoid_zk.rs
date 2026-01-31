use anchor_lang::prelude::*;
use crate::*;

#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::system_program;

    #[test]
    fn test_initialize() {
        let mut program = ProgramTest::new(
            "solvoid_zk",
            id(),
            processor!(solvoid_zk::entry),
        );

        program.start().unwrap();

        // Test initialization
        let authority = Pubkey::new_unique();
        let (state_pda, state_bump) = Pubkey::find_program_address(&[b"state"], &id());
        
        let mut ctx = program
            .accounts_context(accounts::Initialize {
                state: state_pda,
                authority,
                system_program: system_program::ID,
            })
            .unwrap();

        ctx.accounts.state.bump = state_bump;
        
        let result = solvoid_zk::initialize(ctx, authority);
        assert!(result.is_ok());
    }

    #[test]
    fn test_deposit() {
        let mut program = ProgramTest::new(
            "solvoid_zk",
            id(),
            processor!(solvoid_zk::entry),
        );

        program.start().unwrap();

        // Test deposit
        let authority = Pubkey::new_unique();
        let depositor = Pubkey::new_unique();
        let commitment = [1u8; 32];
        let amount = 1_000_000; // 0.001 SOL
        
        let (state_pda, state_bump) = Pubkey::find_program_address(&[b"state"], &id());
        let (vault_pda, vault_bump) = Pubkey::find_program_address(&[b"vault"], &id());
        let (root_history_pda, root_history_bump) = Pubkey::find_program_address(&[b"root_history"], &id());
        
        let mut ctx = program
            .accounts_context(accounts::Deposit {
                state: state_pda,
                vault: vault_pda,
                root_history: root_history_pda,
                depositor,
                system_program: system_program::ID,
            })
            .unwrap();

        ctx.accounts.state.bump = state_bump;
        ctx.accounts.vault.bump = vault_bump;
        ctx.accounts.root_history.bump = root_history_bump;
        
        let result = solvoid_zk::deposit(ctx, commitment, amount);
        assert!(result.is_ok());
    }
}
