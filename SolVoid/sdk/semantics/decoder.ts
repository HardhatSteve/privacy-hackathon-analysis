import { Idl } from './types';

export class InstructionDecoder {
    private idls: Map<string, Idl> = new Map();

    public registerIdl(programId: string, idl: Idl) {
        this.idls.set(programId, idl);
    }

    public decode(programId: string, _data: Buffer): any {
        const idl = this.idls.get(programId);
        if (!idl) return null;

        // Simplified: Attempt to find which instruction this matches
        // In reality, uses 8-byte discriminator
        for (const ix of idl.instructions) {
            try {
                // Here we would use the layouts to decode
                return { name: ix.name, data: "Decoded semantic data" };
            } catch {
                continue;
            }
        }
        return null;
    }
}
