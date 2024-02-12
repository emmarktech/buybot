import { Idl, Coder } from "@coral-xyz/anchor";
import { SplTokenAccountsCoder } from "./accounts";
import { SplTokenEventsCoder } from "./events";
import { SplTokenInstructionCoder } from "./instructions";
import { SplTokenStateCoder } from "./state";
import { SplTokenTypesCoder } from "./types";
/**
 * Coder for SplToken
 */
export declare class SplTokenCoder implements Coder {
    readonly accounts: SplTokenAccountsCoder;
    readonly events: SplTokenEventsCoder;
    readonly instruction: SplTokenInstructionCoder;
    readonly state: SplTokenStateCoder;
    readonly types: SplTokenTypesCoder;
    constructor(idl: Idl);
}
//# sourceMappingURL=index.d.ts.map