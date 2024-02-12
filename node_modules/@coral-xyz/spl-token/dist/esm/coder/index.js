import { SplTokenAccountsCoder } from "./accounts";
import { SplTokenEventsCoder } from "./events";
import { SplTokenInstructionCoder } from "./instructions";
import { SplTokenStateCoder } from "./state";
import { SplTokenTypesCoder } from "./types";
/**
 * Coder for SplToken
 */
export class SplTokenCoder {
    constructor(idl) {
        this.accounts = new SplTokenAccountsCoder(idl);
        this.events = new SplTokenEventsCoder(idl);
        this.instruction = new SplTokenInstructionCoder(idl);
        this.state = new SplTokenStateCoder(idl);
        this.types = new SplTokenTypesCoder(idl);
    }
}
//# sourceMappingURL=index.js.map