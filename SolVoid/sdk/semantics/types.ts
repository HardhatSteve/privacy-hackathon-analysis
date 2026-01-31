import { z } from 'zod';
import {
    IdlSchema,
    IdlInstructionSchema,
    IdlAccountSchema,
    IdlTypeSchema,
    IdlEventSchema,
    IdlErrorSchema,
    IdlFieldSchema
} from '../integrity';

export type Idl = z.infer<typeof IdlSchema>;
export type IdlInstruction = z.infer<typeof IdlInstructionSchema>;
export type IdlAccount = z.infer<typeof IdlAccountSchema>;
export type IdlType = z.infer<typeof IdlTypeSchema>;
export type IdlEvent = z.infer<typeof IdlEventSchema>;
export type IdlError = z.infer<typeof IdlErrorSchema>;
export type IdlField = z.infer<typeof IdlFieldSchema>;
