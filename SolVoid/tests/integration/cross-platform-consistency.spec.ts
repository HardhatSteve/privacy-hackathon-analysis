import { CrossPlatformConsistencyTest } from './cross-platform-consistency.test';

describe('Cross-Platform Poseidon Consistency', () => {
    it('should produce identical hash results between Rust and TypeScript', async () => {
        await CrossPlatformConsistencyTest.run();
    }, 60000); // 60 second timeout for compilation and execution
});
