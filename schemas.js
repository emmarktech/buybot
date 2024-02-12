import mongoose from "mongoose";

const volumeByToken = new mongoose.Schema({
    token: String,
    chain: String,
    volume: Number,
    supply: String,
    numberofbuys: Number,
    pair: String,
    name: String,
    isexcludedfromchecks: Boolean,
    symbol: String,
    lasthoneypotcheck: Number,
    uniqueaddresschain: { type: String, unique: true }
}, { autoIndex: true })

const chainInfo = new mongoose.Schema({
    chain: String,
    lastBuyProcessed: Number,
    buyvolume: Number,
    buyscount: Number,
    gwei: Number,
    lastBlock: Number,
    coinPrice: Number
})

const userinfo = new mongoose.Schema({
    tgid: { type: String, unique: true },
    privatekeys: [String],
    solanaprivatekeys: [String],
    solanareferral: String,
    defaultnumberofwallets: { type: Number, default: 1 },
    buygwei: { type: Number, default: 5 },
    sellgwei: { type: Number, default: 10 },
    approvegwei: { type: Number, default: 5 },
    buyslippage: { type: Number, default: 10 },
    sellslippage: { type: Number, default: 10 },
    maxbuytax: { type: Number, default: 30 },
    maxselltax: { type: Number, default: 30 },
    defaultwallet: String,
    menuchain: { type: String, default: 'eth' },
})

const openMonitors = new mongoose.Schema({
    tokenaddress: String,
    chain: String,
    chatid: String,
    messageid: String,
    openedat: Number,
    userid: String,
    issellbuttons: Boolean
})

const infoByAmmId = new mongoose.Schema({
    ammId: String,
    quoteVault: String,
    baseVault: String,
    quoteToken: String,
    baseToken: String,
    quoteDecimals: String,
    baseDecimals: String,
})


const infoByAmmIdSchema = mongoose.model('infobyammid', infoByAmmId)

let volumeByTokenSchema = mongoose.model('tokenvolumes', volumeByToken)

const chainInfoSchema = mongoose.model('chaininfo', chainInfo)

const userinfoSchema = mongoose.model('userinfo', userinfo)

const openMonitorsSchema = mongoose.model('openmonitor', openMonitors)

export { infoByAmmIdSchema, openMonitorsSchema, userinfoSchema, chainInfoSchema, volumeByTokenSchema }