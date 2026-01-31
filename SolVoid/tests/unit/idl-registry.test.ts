import { describe, it, expect, beforeEach } from '@jest/globals';
import { IdlRegistry } from '../../sdk/semantics/idl-registry';
import { Idl } from '../../sdk/semantics/types';

describe('IdlRegistry', () => {
    let registry: IdlRegistry;

    beforeEach(() => {
        registry = new IdlRegistry();
    });

    it('should load pre-seeded system program IDL', async () => {
        const idl = await registry.fetchIdl('11111111111111111111111111111111');
        expect(idl?.name).toBe('system_program');
    });

    it('should load pre-seeded SPL token IDL', async () => {
        const idl = await registry.fetchIdl('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
        expect(idl?.name).toBe('spl_token');
    });

    it('should register custom IDLs', () => {
        const mockIdl: Idl = {
            version: '0.1.0',
            name: 'mock',
            instructions: []
        };
        const mockProgramId = 'Mock111111111111111111111111111111111';
        registry.registerIdl(mockProgramId, mockIdl);

        // Using any cast to access private cache for test verification
        const saved = (registry as any).cache.get(mockProgramId);
        expect(saved?.name).toBe('mock');
    });

    it('should return null for unknown programs', async () => {
        const idl = await registry.fetchIdl('Unknown11111111111111111111111111111111');
        expect(idl).toBeNull();
    });

    it('should handle invalid public keys gracefully in fetchIdl', async () => {
        // Since IdlRegistry.fetchIdl calls enforce(PublicKeySchema), it should throw
        await expect(registry.fetchIdl('invalid-key')).rejects.toThrow(/Invalid Base58 Public Key/);
    });
});
