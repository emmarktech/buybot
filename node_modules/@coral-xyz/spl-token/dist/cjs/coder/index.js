"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SplTokenCoder = void 0;
const accounts_1 = require("./accounts");
const events_1 = require("./events");
const instructions_1 = require("./instructions");
const state_1 = require("./state");
const types_1 = require("./types");
/**
 * Coder for SplToken
 */
class SplTokenCoder {
    constructor(idl) {
        this.accounts = new accounts_1.SplTokenAccountsCoder(idl);
        this.events = new events_1.SplTokenEventsCoder(idl);
        this.instruction = new instructions_1.SplTokenInstructionCoder(idl);
        this.state = new state_1.SplTokenStateCoder(idl);
        this.types = new types_1.SplTokenTypesCoder(idl);
    }
}
exports.SplTokenCoder = SplTokenCoder;
//# sourceMappingURL=index.js.map