import { PublicKey } from '@solana/web3.js';
import { SerumVersion } from './type.js';

declare const _SERUM_PROGRAM_ID_V3 = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin";
declare const SERUM_PROGRAM_ID_V3: PublicKey;
declare const SERUM_PROGRAMID_TO_VERSION: {
    [key: string]: SerumVersion;
};
declare const SERUM_VERSION_TO_PROGRAMID: {
    [key in SerumVersion]?: PublicKey;
} & {
    [K: number]: PublicKey;
};

export { SERUM_PROGRAMID_TO_VERSION, SERUM_PROGRAM_ID_V3, SERUM_VERSION_TO_PROGRAMID, _SERUM_PROGRAM_ID_V3 };
