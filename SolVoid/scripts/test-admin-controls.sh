#!/bin/bash

# Test Admin Controls Script
# This script tests all admin control functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN} $1${NC}"
}

log_error() {
    echo -e "${RED} $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

# Test emergency mode controls
test_emergency_mode() {
    log_info "Testing emergency mode controls..."
    
    # Test emergency mode activation
    log_info "Testing emergency mode activation..."
    if node -e "
    const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
    const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
    
    async function test() {
        const connection = new Connection('http://localhost:8899', 'confirmed');
        const payer = Keypair.generate();
        const provider = new AnchorProvider(connection, new Wallet(payer), {});
        
        const idl = JSON.parse(require('fs').readFileSync('./target/idl/solvoid.json', 'utf8'));
        const programId = JSON.parse(require('fs').readFileSync('./target/deploy/solvoid.json', 'utf8')).programId;
        const program = new Program(idl, programId, provider);
        
        // Derive PDAs
        const [stateAddress] = PublicKey.findProgramAddressSync([Buffer.from("state")], program.programId);
        const [economicAddress] = PublicKey.findProgramAddressSync([Buffer.from("economic_state")], program.programId);
        
        try {
            // Test emergency mode activation
            await program.methods
                .triggerEmergencyMode(new anchor.BN(2), "Test Emergency")
                .accounts({
                    state: stateAddress,
                    economicState: economicAddress,
                    authority: payer.publicKey,
                })
                .rpc();
                
            console.log('Emergency mode activation test passed');
            return true;
        } catch (error) {
            console.error('Emergency mode activation failed:', error.message);
            return false;
        }
    }
    
    test().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(console.error);
    " 2>/dev/null; then
        log_success "Emergency mode activation test passed"
    else
        log_error "Emergency mode activation test failed"
    fi
    
    # Test emergency mode deactivation
    log_info "Testing emergency mode deactivation..."
    if node -e "
    const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
    const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
    
    async function test() {
        const connection = new Connection('http://localhost:8899', 'confirmed');
        const payer = Keypair.generate();
        const provider = new AnchorProvider(connection, new Wallet(payer), {});
        
        const idl = JSON.parse(require('fs').readFileSync('./target/idl/solvoid.json', 'utf8'));
        const programId = JSON.parse(require('fs').readFileSync('./target/deploy/solvoid.json', 'utf8')).programId;
        const program = new Program(idl, programId, provider);
        
        const [stateAddress] = PublicKey.findProgramAddressSync([Buffer.from("state")], program.programId);
        const [economicAddress] = PublicKey.findProgramAddressSync([Buffer.from("economic_state")], program.programId);
        
        try {
            // Test emergency mode deactivation
            await program.methods
                .disableEmergencyMode()
                .accounts({
                    state: stateAddress,
                    economicState: economicAddress,
                    authority: payer.publicKey,
                })
                .rpc();
                
            console.log('Emergency mode deactivation test passed');
            return true;
        } catch (error) {
            console.error('Emergency mode deactivation failed:', error.message);
            return false;
        }
    }
    
    test().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(console.error);
    " 2>/dev/null; then
        log_success "Emergency mode deactivation test passed"
    else
        log_error "Emergency mode deactivation test failed"
    fi
}

# Test fee multiplier adjustment
test_fee_multiplier() {
    log_info "Testing fee multiplier adjustment..."
    
    if node -e "
    const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
    const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
    
    async function test() {
        const connection = new Connection('http://localhost:8899', 'confirmed');
        const payer = Keypair.generate();
        const provider = new AnchorProvider(connection, new Wallet(payer), {});
        
        const idl = JSON.parse(require('fs').readFileSync('./target/idl/solvoid.json', 'utf8'));
        const programId = JSON.parse(require('fs').readFileSync('./target/deploy/solvoid.json', 'utf8')).programId;
        const program = new Program(idl, programId, provider);
        
        const [stateAddress] = PublicKey.findProgramAddressSync([Buffer.from("state")], program.programId);
        const [economicAddress] = PublicKey.findProgramAddressSync([Buffer.from("economic_state")], program.programId);
        
        try {
            // Test valid fee multiplier (within limits)
            await program.methods
                .triggerEmergencyMode(new anchor.BN(5), "Valid Multiplier") 
                .accounts({
                    state: stateAddress,
                    economicState: economicAddress,
                    authority: payer.publicKey,
                })
                .rpc();
                
            console.log('Valid fee multiplier test passed');
            
            // Test invalid fee multiplier (exceeds limits)
            try {
                await program.methods
                    .triggerEmergencyMode(new anchor.BN(1000), "Invalid Multiplier") 
                    .accounts({
                        state: stateAddress,
                        economicState: economicAddress,
                        authority: payer.publicKey,
                    })
                    .rpc();
                    
                console.error('Invalid fee multiplier should have failed');
                return false;
            } catch (error) {
                if (error.message.includes('InvalidEmergencyMultiplier')) {
                    console.log('Invalid fee multiplier rejection test passed');
                    return true;
                } else {
                    console.error('Unexpected error:', error.message);
                    return false;
                }
            }
        } catch (error) {
            console.error('Fee multiplier test failed:', error.message);
            return false;
        }
    }
    
    test().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(console.error);
    " 2>/dev/null; then
        log_success "Fee multiplier adjustment test passed"
    else
        log_error "Fee multiplier adjustment test failed"
    fi
}

# Test pause/resume operations
test_pause_resume() {
    log_info "Testing pause/resume operations..."
    
    if node -e "
    const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
    const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
    
    async function test() {
        const connection = new Connection('http://localhost:8899', 'confirmed');
        const payer = Keypair.generate();
        const provider = new AnchorProvider(connection, new Wallet(payer), {});
        
        const idl = JSON.parse(require('fs').readFileSync('./target/idl/solvoid.json', 'utf8'));
        const programId = JSON.parse(require('fs').readFileSync('./target/deploy/solvoid.json', 'utf8')).programId;
        const program = new Program(idl, programId, provider);
        
        const [stateAddress] = PublicKey.findProgramAddressSync([Buffer.from("state")], program.programId);
        const [economicAddress] = PublicKey.findProgramAddressSync([Buffer.from("economic_state")], program.programId);
        
        try {
            // Test pause operations (Circuit Breaker)
            await program.methods
                .triggerCircuitBreaker()
                .accounts({
                    state: stateAddress,
                    economicState: economicAddress,
                    authority: payer.publicKey,
                })
                .rpc();
                
            console.log('Pause operations test passed');
            
            // Test resume operations
            await program.methods
                .resetCircuitBreaker()
                .accounts({
                    state: stateAddress,
                    economicState: economicAddress,
                    authority: payer.publicKey,
                })
                .rpc();
                
            console.log('Resume operations test passed');
            return true;
        } catch (error) {
            console.error('Pause/resume test failed:', error.message);
            return false;
        }
    }
    
    test().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(console.error);
    " 2>/dev/null; then
        log_success "Pause/resume operations test passed"
    else
        log_error "Pause/resume operations test failed"
    fi
}

# Test admin authentication
test_admin_auth() {
    log_info "Testing admin authentication..."
    
    # Check if admin key files exist
    if [ -f "relayer/keys/admin.json" ]; then
        log_success "Admin key file exists"
    else
        log_warning "Admin key file not found, using test key"
    fi
    
    # Test admin key format
    if node -e "
    const fs = require('fs');
    
    try {
        const adminKey = JSON.parse(fs.readFileSync('relayer/keys/admin.json', 'utf8'));
        
        // Check if key has required fields
        if (adminKey.publicKey && adminKey.privateKey) {
            console.log('Admin key format is valid');
            process.exit(0);
        } else {
            console.error('Admin key format is invalid');
            process.exit(1);
        }
    } catch (error) {
        console.error('Admin key test failed:', error.message);
        process.exit(1);
    }
    " 2>/dev/null; then
        log_success "Admin key format validation passed"
    else
        log_error "Admin key format validation failed"
    fi
}

# Test admin permissions
test_admin_permissions() {
    log_info "Testing admin permissions..."
    
    # Test that only admin can call admin functions
    if node -e "
    const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
    const { Program, AnchorProvider, Wallet } = require('@coral-xyz/anchor');
    
    async function test() {
        const connection = new Connection('http://localhost:8899', 'confirmed');
        const admin = Keypair.generate();
        const user = Keypair.generate();
        const provider = new AnchorProvider(connection, new Wallet(admin), {});
        
        const idl = JSON.parse(require('fs').readFileSync('./target/idl/solvoid.json', 'utf8'));
        const programId = JSON.parse(require('fs').readFileSync('./target/deploy/solvoid.json', 'utf8')).programId;
        const program = new Program(idl, programId, provider);
        
        const stateAccount = Keypair.generate();
        
        try {
            // Test admin can call admin functions
            await program.methods
                .triggerEmergencyMode(new anchor.BN(2), "Admin Test")
                .accounts({
                    state: stateAddress,
                    economicState: economicAddress,
                    authority: admin.publicKey,
                })
                .rpc();
                
            console.log('Admin permissions test passed');
            
            // Test non-admin cannot call admin functions
            const userProvider = new AnchorProvider(connection, new Wallet(user), {});
            const userProgram = new Program(idl, programId, userProvider);
            
            try {
                await userProgram.methods
                    .triggerEmergencyMode(new anchor.BN(2), "Naughty User")
                    .accounts({
                        state: stateAddress,
                        economicState: economicAddress,
                        authority: user.publicKey,
                    })
                    .rpc();
                    
                console.error('Non-admin should not be able to call admin functions');
                return false;
            } catch (error) {
                if (error.message.includes('InvalidAuthority')) {
                    console.log('Non-admin permission rejection test passed');
                    return true;
                } else {
                    console.error('Unexpected error:', error.message);
                    return false;
                }
            }
        } catch (error) {
            console.error('Admin permissions test failed:', error.message);
            return false;
        }
    }
    
    test().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(console.error);
    " 2>/dev/null; then
        log_success "Admin permissions test passed"
    else
        log_error "Admin permissions test failed"
    fi
}

# Main test execution
main() {
    echo " Testing Admin Controls"
    echo "======================="
    
    test_emergency_mode
    test_fee_multiplier
    test_pause_resume
    test_admin_auth
    test_admin_permissions
    
    echo ""
    echo " Admin controls testing completed!"
}

# Run main function
main "$@"
