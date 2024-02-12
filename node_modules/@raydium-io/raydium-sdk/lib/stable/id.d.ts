import { PublicKey } from '@solana/web3.js';
import { SerumVersion } from '../serum/type.js';
import { StableVersion } from './type.js';

declare const _STABLE_PROGRAM_ID_V1 = "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h";
declare const STABLE_PROGRAM_ID_V1: PublicKey;
declare const STABLE_PROGRAMID_TO_VERSION: {
    [key: string]: StableVersion;
};
declare const LIQUIDITY_VERSION_TO_SERUM_VERSION: {
    [key in StableVersion]?: SerumVersion;
} & {
    [K: number]: SerumVersion;
};

export { LIQUIDITY_VERSION_TO_SERUM_VERSION, STABLE_PROGRAMID_TO_VERSION, STABLE_PROGRAM_ID_V1, _STABLE_PROGRAM_ID_V1 };
