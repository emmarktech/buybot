import BigNumber from "bignumber.js";
import { HoneypotIsV1 } from "@normalizex/honeypot-is";
import {
  chainInfoSchema,
  infoByAmmIdSchema,
  openMonitorsSchema,
  userinfoSchema,
  volumeByTokenSchema,
} from "./schemas.js";
import { Telegraf } from "telegraf";
import { ethers } from "ethers";
import axios from "axios";
import https from "https";
import contractABI from "./abi/contractABI.json" assert { type: "json" };
import V3Factory from "./abi/V3Factory.json" assert { type: "json" };
import uniswapFactoryABI from "./abi/uniswapFactoryABI.json" assert { type: "json" };
import uniswapRouterAbi from "./abi/uniswapRouterABI.json" assert { type: "json" };
import V3LPPairABI from "./abi/V3LPPair.json" assert { type: "json" };
import QuoterAbi from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json" assert { type: "json" };
import QuoterAbiV2 from "@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json" assert { type: "json" };
import {
  LIQUIDITY_STATE_LAYOUT_V4,
  Liquidity,
  TokenAmount,
  Token,
  TOKEN_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
  SPLTOKEN,
  MARKET_STATE_LAYOUT_V3,
} from "./raydiumexport.cjs";
import {
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccount
} from "@solana/spl-token";
import { deleteMessage } from "./tgSystem.js";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { base58 } from "ethers/lib/utils.js";
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(`mongodb://mvt:mvt2023password@162.254.37.46:27017/admin`);

const axios2 = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false, // WARNING: This disables SSL verification.
  }),
});

let pairTokens = [
  "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  "0x55d398326f99059ff775485246999027b3197955",
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "0x6b175474e89094c44da98b954eedeac495271d0f",
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
  "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  "0x4200000000000000000000000000000000000006",
  "0x4bd8761f5fd9b4d6e2d3070d548b97adf62480db",
];

let wrappedCoins = [
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
];

const providereth = new ethers.providers.JsonRpcProvider("eth rpc");
const providerbsc = new ethers.providers.JsonRpcProvider("bsc rpc");
const connection = new Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

const ethRouter = new ethers.Contract(
  "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  uniswapRouterAbi,
  providereth
);
const bscRouter = new ethers.Contract(
  "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  uniswapRouterAbi,
  providerbsc
);
const ethQuoter = new ethers.Contract(
  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
  QuoterAbi.abi,
  providereth
);
const bscQuoter = new ethers.Contract(
  "0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997",
  QuoterAbiV2.abi,
  providerbsc
);

const ethFactory = new ethers.Contract(
  "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  uniswapFactoryABI,
  providereth
);
const ethV3Factory = new ethers.Contract(
  "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  V3Factory,
  providereth
);
const bscFactory = new ethers.Contract(
  "0xca143ce32fe78f1f7019d7d551a6402fc5350c73",
  uniswapFactoryABI,
  providerbsc
);
const bscV3Factory = new ethers.Contract(
  "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865",
  V3Factory,
  providerbsc
);

const honeypotis = new HoneypotIsV1();

const token = "6946830740:AAESUww3GYi_hEWXtO6WYhLCgK_DnU5_J2g";

const bot = new Telegraf(token);
bot.catch((err) => {});

// Functions For Editing Menus Or Verifying

async function editAllMenus(token, chain) {
  try {
    const {
      address,
      pair,
      name,
      symbol,
      balances,
      contractBalance,
      price,
      coinprice,
      tokendecimals,
      coindecimals,
      coinsymbol,
      explorer,
      chart,
      totalSupply,
      maxBuy,
      maxSell,
      buyFee,
      sellFee,
      buyGas,
      sellGas,
      gwei,
      pairwith,
      isv3pair,
      fee,
    } = await getTokenInfo(token);
    const monitors = await openMonitorsSchema.find({
      tokenaddress: token,
      chain: chain,
    });
    const token2 = new ethers.Contract(
      address,
      contractABI,
      getProviderByChain(chain)
    );
    for (let monitor of monitors) {
      const userinfo = await userinfoSchema.findOne({ tgid: monitor.userid });
      const privatekeys = userinfo.privatekeys;
      let realbalances = [];
      for (let i = 0; i < privatekeys.length; i++) {
        try {
          const wallet = new ethers.Wallet(privatekeys[i]);
          const walletBalance = await token2.balanceOf(wallet.address);
          balances.push(new BigNumber(String(walletBalance)).toFixed());
        } catch {
          balances.push("0");
        }
      }
      await editTokenBuyMenu(
        monitor.chatid,
        monitor.messageid,
        address,
        pair,
        name,
        symbol,
        realbalances,
        contractBalance,
        price,
        coinprice,
        tokendecimals,
        coindecimals,
        coinsymbol,
        explorer,
        chart,
        totalSupply,
        maxBuy,
        maxSell,
        buyFee,
        sellFee,
        buyGas,
        sellGas,
        gwei,
        pairwith,
        isv3pair,
        fee,
        undefined,
        true
      );
    }
  } catch {}
}

async function getTokenAccountsByOwner(connection, owner) {
  const tokenResp = await connection.getTokenAccountsByOwner(
    owner,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  const accounts = [];

  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      pubkey,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}

async function editTokenBuyMenu(
  chatid,
  messageid,
  address,
  pair,
  name,
  symbol,
  balances,
  contractbalance,
  price,
  coinprice,
  tokendecimals,
  coindecimals,
  coinsymbol,
  explorer,
  chart,
  totalsupply,
  maxBuy,
  maxSell,
  buyFee,
  sellFee,
  buyGas,
  sellGas,
  gwei,
  pairwith,
  isv3pair,
  fee,
  isSellButtons,
  dontChangeButtons
) {
  try {
    const monitorInfo = await openMonitorsSchema.findOne({
      chatid: chatid,
      messageid: messageid,
    });
    const totalsupplywithoutdecimals = new BigNumber(totalsupply)
      .dividedBy(getDividerByDecimals(tokendecimals))
      .toFixed(0);
    const userinfo = await userinfoSchema.findOne({ tgid: chatid });
    let numberOfWallet = userinfo.defaultnumberofwallets;
    if (userinfo.privatekeys.length < numberOfWallet) {
      numberOfWallet = userinfo.privatekeys.length;
    }
    let chain = "eth";
    let explorername = "Etherscan";
    if (gwei == 3) {
      chain = "bnb";
      explorername = "Bscscan";
    }
    let buyxline = [
      { text: `Buy X ${coinsymbol}`, callback_data: "buyxeth" },
      { text: `Buy Max`, callback_data: "buymax" },
      { text: `Buy X ${symbol}`, callback_data: "buyxtokens" },
    ];
    let totalBalance = 0;
    let walletBalances = "";
    let walletsWithBalances = [];
    for (let i = 0; i < balances.length; i++) {
      let balance = Number(balances[i]);
      totalBalance += balance;
      if (balance > 0) {
        if (walletBalances === "") {
          walletBalances = stringTg(`
---------------------------`);
        }
        walletsWithBalances.push(i + 1);
        const value = customToFixed(
          new BigNumber(balance)
            .multipliedBy(price)
            .dividedBy(getDividerByDecimals(coindecimals))
            .toFixed()
        );
        const dollarvalue = new BigNumber(value)
          .multipliedBy(coinprice)
          .toFixed(2);
        balance = new BigNumber(balance)
          .dividedBy(getDividerByDecimals(tokendecimals))
          .toNumber();
        walletBalances =
          walletBalances +
          stringTg(`
💰 Wallet #${i + 1}: `) +
          `*${stringTg(balance.toLocaleString())} ` +
          `${stringTg(symbol)} \\| ${stringTg(
            value
          )} ${coinsymbol} \\| ${stringTg(dollarvalue)}\\$*`;
      }
    }
    let totalBalanceInfo = "";
    let totalBalanceEmoji = "⚖️";
    if (totalBalance > 0) {
      const totalvalue = customToFixed(
        new BigNumber(totalBalance)
          .multipliedBy(price)
          .dividedBy(getDividerByDecimals(coindecimals))
          .toFixed()
      );
      const totaldollarvalue = new BigNumber(totalvalue)
        .multipliedBy(coinprice)
        .toFixed(2);
      totalBalanceInfo = `*\\| ${stringTg(
        totalvalue
      )} ${coinsymbol} \\| ${stringTg(totaldollarvalue)}\\$*`;
      totalBalance = new BigNumber(totalBalance)
        .dividedBy(getDividerByDecimals(tokendecimals))
        .toNumber();
      totalBalanceEmoji = "⤵";
      if (isSellButtons == undefined) {
        isSellButtons = true;
      }
    }
    let maxsell = "\\-";
    let maxbuy = "\\-";
    if (maxBuy) {
      if (maxBuy !== "Unlimited") {
        const maxbuyvalues = getValueAndDollarValue(
          new BigNumber(maxBuy)
            .multipliedBy(getDividerByDecimals(tokendecimals))
            .toFixed(0),
          price,
          coindecimals,
          coinprice
        );
        maxbuy = stringTg(
          new BigNumber(100)
            .dividedBy(
              new BigNumber(totalsupplywithoutdecimals).dividedBy(maxBuy)
            )
            .toFixed(2) +
            `% | ${maxbuyvalues.value} ${coinsymbol} | ${maxbuyvalues.dollarvalue}$`
        );
      } else {
        buyxline = [
          { text: `Buy X ${coinsymbol}`, callback_data: "buyxeth" },
          { text: `Buy X ${symbol}`, callback_data: "buyxtokens" },
        ];
        maxbuy = "Unlimited";
      }
    }
    if (maxSell) {
      if (maxSell !== "Unlimited") {
        const maxsellvalues = getValueAndDollarValue(
          new BigNumber(maxSell)
            .multipliedBy(getDividerByDecimals(tokendecimals))
            .toFixed(0),
          price,
          coindecimals,
          coinprice
        );
        maxsell = stringTg(
          new BigNumber(100)
            .dividedBy(new BigNumber(totalsupply).dividedBy(maxSell))
            .toFixed(2) +
            `% | ${maxsellvalues.value} ${coinsymbol} | ${maxsellvalues.dollarvalue}$`
        );
      } else {
        maxsell = "Unlimited";
      }
    }
    let buyGasPrice = "\\-";
    let sellGasPrice = "\\-";
    if (buyGas) {
      buyGasPrice =
        stringTg(customToFixed(Number((buyGas * gwei) / 1000000000))) +
        " " +
        coinsymbol;
    }
    if (sellGas) {
      sellGasPrice =
        stringTg(customToFixed(Number((sellGas * gwei) / 1000000000))) +
        " " +
        coinsymbol;
    }
    let marketCap = `0\\$`;
    if (Number(price) > 0) {
      marketCap = stringTg(
        Number(
          getValueAndDollarValue(totalsupply, price, coindecimals, coinprice)
            .dollarvalue
        ).toLocaleString() + "$"
      );
    }
    let contractBalance = "0\\%";
    let contractBalanceInfo = "";
    if (Number(contractbalance) > 0.01) {
      const contractBalanceValues = getValueAndDollarValue(
        contractbalance,
        price,
        coindecimals,
        coinprice
      );
      contractBalance = stringTg(
        customToFixed(
          new BigNumber(100)
            .dividedBy(new BigNumber(totalsupply).dividedBy(contractbalance))
            .toFixed(2)
        ) + `%`
      );
      if (
        Number(
          new BigNumber(100)
            .dividedBy(new BigNumber(totalsupply).dividedBy(contractbalance))
            .toFixed(2)
        ) > 0.049
      ) {
        contractBalanceInfo = stringTg(
          `| ${contractBalanceValues.value} ${coinsymbol} | ${contractBalanceValues.dollarvalue}$`
        );
      }
    }
    if (dontChangeButtons) {
      isSellButtons = monitorInfo.issellbuttons;
    }
    let keyboard;
    if (isSellButtons) {
      await openMonitorsSchema.findOneAndUpdate(
        { chatid: chatid, messageid: messageid },
        { issellbuttons: true }
      );
      let firstline = [];
      let secondline = [];
      let thirdline = [];
      let sellAllButton = [];
      for (let i = 0; i < walletsWithBalances.length; i++) {
        if (i == 0) {
          sellAllButton.push({
            text: `Sell All Wallets`,
            callback_data: `sellallwallets`,
          });
        }
        if (i <= 1) {
          firstline.push({
            text: `Sell Wallet #${walletsWithBalances[i]}`,
            callback_data: `sellwallet${walletsWithBalances[i]}`,
          });
        } else if (i > 1 && i <= 3) {
          secondline.push({
            text: `Sell Wallet #${walletsWithBalances[i]}`,
            callback_data: `sellwallet${walletsWithBalances[i]}`,
          });
        } else if (i > 2 && i <= 5) {
          thirdline.push({
            text: `Sell Wallet #${walletsWithBalances[i]}`,
            callback_data: `sellwallet${walletsWithBalances[i]}`,
          });
        }
      }
      keyboard = [
        sellAllButton,
        firstline,
        secondline,
        thirdline,
        [
          { text: `🟢 Refresh`, callback_data: "switchtosell" },
          { text: `🔄 Switch To Buy Menu`, callback_data: "switchtobuy" },
        ],
        [{ text: `🔴 Close Menu`, callback_data: "closemenu" }],
      ];
    } else {
      await openMonitorsSchema.findOneAndUpdate(
        { chatid: chatid, messageid: messageid },
        { issellbuttons: false }
      );
      keyboard = [
        [
          {
            text: `💳 Wallets To Buy: ${numberOfWallet}`,
            callback_data: "changenumberofwallets",
          },
        ],
        [
          { text: `Buy 0.05 ${coinsymbol}`, callback_data: "buytoken1" },
          { text: `Buy 0.1 ${coinsymbol}`, callback_data: "buytoken2" },
        ],
        [
          { text: `Buy 0.3 ${coinsymbol}`, callback_data: "buytoken3" },
          { text: `Buy 0.5 ${coinsymbol}`, callback_data: "buytoken4" },
        ],
        [
          { text: `Buy 1 ${coinsymbol}`, callback_data: "buytoken5" },
          { text: `Buy 3 ${coinsymbol}`, callback_data: "buytoken6" },
        ],
        buyxline,
        [
          { text: `🟢 Refresh`, callback_data: "switchtobuy" },
          { text: `🔄 Switch To Sell Menu`, callback_data: "switchtosell" },
        ],
        [{ text: `🔴 Close Menu`, callback_data: "closemenu" }],
      ];
    }
    await bot.telegram
      .editMessageText(
        chatid,
        messageid,
        undefined,
        `[​](https://${chain}.com/)[​](https://${buyGas}.com/)[​](https://${sellGas}.com/)[​](https://${buyFee}.com/)[​](https://${sellFee}.com/)[​](https://${pairwith}.com/)[​](https://${tokendecimals}.com/)[​](https://${pair}.com/)[​](https://${isv3pair}.com/)[​](https://${fee}.com/)[​](https://${symbol}.com/)[​](https://${maxBuy}.com/)[​](https://${maxSell}.com/)[​](https://${
          balances[0]
        }.com/)[​](https://${balances[1]}.com/)[​](https://${
          balances[2]
        }.com/)[​](https://${balances[3]}.com/)[​](https://${
          balances[4]
        }.com/)🎟️ *${stringTg(name)} \\(${stringTg(symbol)}\\)*
\`${address}\`

🧾 Tax: *🟢 Buy: ${buyFee}\\% 🔴 Sell: ${sellFee}\\%*
⛽️ Gas: *🟢 Buy: ${buyGasPrice} 🔴 Sell: ${sellGasPrice}*

🔝 Max Buy: *${maxbuy}*
🔝 Max Sell: *${maxsell}*

📄 Contract Balance: *${contractBalance} ${contractBalanceInfo}*
${totalBalanceEmoji} Your Total Balance: *${stringTg(
          totalBalance.toLocaleString()
        )} ${stringTg(symbol)}* ${totalBalanceInfo} ${walletBalances}

🏦 Market Cap: *${marketCap}*
[Dexscreener](${chart}) \\| [${explorername}](https://${explorer}/address/${address}) \\| /Panel`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: keyboard,
          },
          disable_web_page_preview: true,
        }
      )
      .catch();
    if (totalBalance > 0) {
      let tgid = chatid;
      const userinfo = await userinfoSchema.findOne({ tgid: tgid });
      for (let i = 0; i < userinfo.privatekeys.length; i++) {
        const wallet = new ethers.Wallet(
          userinfo.privatekeys[i],
          getProviderByChain(chain)
        );
        const token = new ethers.Contract(address, contractABI, wallet);
        const chainInfo = await chainInfoSchema.findOne({ chain: chain });
        const approvedAmount = await token.allowance(
          wallet.address,
          getRouterAddressByChain(chain)
        );
        const walletBalance = balances[i];
        if (
          new BigNumber(String(approvedAmount)).lt(
            "80092089237316195423570985008687907853269984665640564039457584007913129639935"
          ) &&
          new BigNumber(walletBalance).gt(100000)
        ) {
          const estimate = String(
            await token.estimateGas.approve(
              getRouterAddressByChain(chain),
              "115792089237316195423570985008687907853269984665640564039457584007913129639935"
            )
          );
          if (
            new BigNumber(
              getGasPrice(
                Number((Number(estimate) / 10) * 12).toFixed(0),
                Number(chainInfo.gwei + userinfo.approvegwei).toFixed(0)
              )
            ).gt(walletBalance)
          ) {
            await bot.telegram
              .sendMessage(
                chatid,
                `🔴 Not enough funds on your wallet #${
                  i + 1
                } to send the approve transaction, please top up your wallet and press "🟢 Refresh".`
              )
              .catch();
            continue;
          }
          const tx = await token.approve(
            getRouterAddressByChain(chain),
            "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            {
              gasLimit: Number((Number(estimate) / 10) * 12).toFixed(0),
              gasPrice: Number(
                (chainInfo.gwei + userinfo.approvegwei) * 1000000000
              ).toFixed(0),
            }
          );
          const message = await bot.telegram
            .sendMessage(
              chatid,
              `🟡 ${stringTg(symbol)} approve sent:

https://${getExplorerByChain(chain)}/tx/${tx.hash}`
            )
            .catch();
          try {
            tx.wait().then(async () => {
              try {
                await bot.telegram.editMessageText(
                  chatid,
                  message.message_id,
                  0,
                  `🟢 ${stringTg(symbol)} approve transaction succeed:

https://${getExplorerByChain(chain)}/tx/${tx.hash}`,
                  {
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: `OK`, callback_data: "closemenu" }],
                      ],
                    },
                  }
                );
              } catch {}
            });
          } catch {
            try {
              await bot.telegram.editMessageText(
                chatid,
                message.message_id,
                0,
                `🔴 ${stringTg(symbol)} approve failed, try again later:

https://${getExplorerByChain(chain)}/tx/${tx.hash}`,
                {
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: `OK`, callback_data: "closemenu" }],
                    ],
                  },
                }
              );
            } catch {}
          }
        }
      }
    }
  } catch (e) {}
}

async function editSolanaTokenBuyMenu(
  chatid,
  messageid,
  address,
  pair,
  name,
  symbol,
  balances,
  price,
  coinprice,
  tokendecimals,
  coindecimals,
  coinsymbol,
  explorer,
  chart,
  totalsupply,
  pairwith,
  isSellButtons,
  dontChangeButtons
) {
  try {
    const monitorInfo = await openMonitorsSchema.findOne({
      chatid: chatid,
      messageid: messageid,
    });
    const userinfo = await userinfoSchema.findOne({ tgid: chatid });
    let numberOfWallet = userinfo.defaultnumberofwallets;
    if (userinfo.privatekeys.length < numberOfWallet) {
      numberOfWallet = userinfo.privatekeys.length;
    }
    let chain = "sol";
    let explorername = "Solscan";
    let buyxline = [
      { text: `Buy X SOL`, callback_data: "buyxsol" },
      { text: `Buy X ${symbol}`, callback_data: "buyxsoltokens" },
    ];
    let totalBalance = 0;
    let walletBalances = "";
    let walletsWithBalances = [];
    for (let i = 0; i < balances.length; i++) {
      let balance = Number(balances[i]);
      totalBalance += balance;
      if (balance > 0) {
        if (walletBalances === "") {
          walletBalances = stringTg(`
---------------------------`);
        }
        walletsWithBalances.push(i + 1);
        const value = customToFixed(
          new BigNumber(balance)
            .multipliedBy(price)
            .dividedBy(getDividerByDecimals(coindecimals))
            .toFixed()
        );
        const dollarvalue = new BigNumber(value)
          .multipliedBy(coinprice)
          .toFixed(2);
        balance = new BigNumber(balance)
          .dividedBy(getDividerByDecimals(tokendecimals))
          .toNumber();
        walletBalances =
          walletBalances +
          stringTg(`
💰 Wallet #${i + 1}: `) +
          `*${stringTg(balance.toLocaleString())} ` +
          `${stringTg(symbol)} \\| ${stringTg(
            value
          )} ${coinsymbol} \\| ${stringTg(dollarvalue)}\\$*`;
      }
    }
    let totalBalanceInfo = "";
    let totalBalanceEmoji = "⚖️";
    if (totalBalance > 0) {
      const totalvalue = customToFixed(
        new BigNumber(totalBalance)
          .multipliedBy(price)
          .dividedBy(getDividerByDecimals(coindecimals))
          .toFixed()
      );
      const totaldollarvalue = new BigNumber(totalvalue)
        .multipliedBy(coinprice)
        .toFixed(2);
      totalBalanceInfo = `*\\| ${stringTg(
        totalvalue
      )} ${coinsymbol} \\| ${stringTg(totaldollarvalue)}\\$*`;
      totalBalance = new BigNumber(totalBalance)
        .dividedBy(getDividerByDecimals(tokendecimals))
        .toNumber();
      totalBalanceEmoji = "⤵";
      if (isSellButtons == undefined) {
        isSellButtons = true;
      }
    }
    let marketCap = `0\\$`;
    let supplywithdecimals = new BigNumber(totalsupply)
      .multipliedBy(10 ** tokendecimals)
      .toFixed();
    if (Number(price) > 0) {
      marketCap = stringTg(
        Number(
          getValueAndDollarValue(
            supplywithdecimals,
            price,
            coindecimals,
            coinprice
          ).dollarvalue
        ).toLocaleString() + "$"
      );
    }
    if (dontChangeButtons) {
      isSellButtons = monitorInfo.issellbuttons;
    }
    let keyboard;
    if (isSellButtons) {
      await openMonitorsSchema.findOneAndUpdate(
        { chatid: chatid, messageid: messageid },
        { issellbuttons: true }
      );
      let firstline = [];
      let secondline = [];
      let thirdline = [];
      let sellAllButton = [];
      for (let i = 0; i < walletsWithBalances.length; i++) {
        if (i == 0) {
          sellAllButton.push({
            text: `Sell All Wallets`,
            callback_data: `sellallsolwallets`,
          });
        }
        if (i <= 1) {
          firstline.push({
            text: `Sell Wallet #${walletsWithBalances[i]}`,
            callback_data: `sellsolwallet${walletsWithBalances[i]}`,
          });
        } else if (i > 1 && i <= 3) {
          secondline.push({
            text: `Sell Wallet #${walletsWithBalances[i]}`,
            callback_data: `sellsolwallet${walletsWithBalances[i]}`,
          });
        } else if (i > 2 && i <= 5) {
          thirdline.push({
            text: `Sell Wallet #${walletsWithBalances[i]}`,
            callback_data: `sellsolwallet${walletsWithBalances[i]}`,
          });
        }
      }
      keyboard = [
        sellAllButton,
        firstline,
        secondline,
        thirdline,
        [
          { text: `🟢 Refresh`, callback_data: "switchtosell" },
          { text: `🔄 Switch To Buy Menu`, callback_data: "switchtobuy" },
        ],
        [{ text: `🔴 Close Menu`, callback_data: "closemenu" }],
      ];
    } else {
      await openMonitorsSchema.findOneAndUpdate(
        { chatid: chatid, messageid: messageid },
        { issellbuttons: false }
      );
      keyboard = [
        [
          {
            text: `💳 Wallets To Buy: ${numberOfWallet}`,
            callback_data: "changenumberofwallets",
          },
        ],
        [
          { text: `Buy 0.01 ${coinsymbol}`, callback_data: "buysoltoken1" },
          { text: `Buy 0.5 ${coinsymbol}`, callback_data: "buysoltoken2" },
        ],
        [
          { text: `Buy 1 ${coinsymbol}`, callback_data: "buysoltoken3" },
          { text: `Buy 2 ${coinsymbol}`, callback_data: "buysoltoken4" },
        ],
        [
          { text: `Buy 5 ${coinsymbol}`, callback_data: "buysoltoken5" },
          { text: `Buy 10 ${coinsymbol}`, callback_data: "buysoltoken6" },
        ],
        buyxline,
        [
          { text: `🟢 Refresh`, callback_data: "switchtobuy" },
          { text: `🔄 Switch To Sell Menu`, callback_data: "switchtosell" },
        ],
        [{ text: `🔴 Close Menu`, callback_data: "closemenu" }],
      ];
    }
    await bot.telegram
      .editMessageText(
        chatid,
        messageid,
        undefined,
        `[​](https://${chain}.com/)[​](https://${pairwith}.com/)[​](https://${tokendecimals}.com/)[​](https://${pair}.com/)[​](https://${symbol}.com/)[​](https://${
          balances[0]
        }.com/)[​](https://${balances[1]}.com/)[​](https://${
          balances[2]
        }.com/)[​](https://${balances[3]}.com/)[​](https://${
          balances[4]
        }.com/)🎟️ *${stringTg(name)} \\(${stringTg(symbol)}\\)*
\`${address}\`
\`${pair}\`

${totalBalanceEmoji} Your Total Balance: *${stringTg(
          totalBalance.toLocaleString()
        )} ${stringTg(symbol)}* ${totalBalanceInfo} ${walletBalances}

🏦 Market Cap: *${marketCap}*
[Dexscreener](${chart}) \\| [${explorername}](https://${explorer}/address/${address}) \\| /Panel`,
        {
          parse_mode: "MarkdownV2",
          reply_markup: {
            inline_keyboard: keyboard,
          },
          disable_web_page_preview: true,
        }
      )
      .catch();
  } catch (e) {
    console.log(e);
  }
}

async function verifyUserMonitors(chatid) {
  try {
    const allUserMonitors = await openMonitorsSchema.find({ chatid: chatid });
    const sortedMonitors = allUserMonitors.sort((a, b) => {
      a.openedat - b.openedat;
    });
    const toDelete = sortedMonitors.length - 3;
    if (toDelete > 0) {
      for (let i = 0; i < toDelete; i++) {
        await openMonitorsSchema.findOneAndDelete({
          chatid: sortedMonitors[i].chatid,
          messageid: sortedMonitors[i].messageid,
        });
        try {
          await deleteMessage(
            sortedMonitors[i].chatid,
            sortedMonitors[i].messageid
          );
        } catch {}
      }
    }
  } catch {}
}

// Sol Functions

async function getRaydiumAmountIn(tokenOut, ammIdAddress, amountOut) {
  const { quoteVault, baseVault, quoteToken } = await getAmmIdInfo(
    ammIdAddress
  );
  const { quoteReserve, baseReserve } = await getReservesByVaults(
    quoteVault,
    baseVault
  );
  let amountIn;
  if (quoteToken == tokenOut) {
    amountIn = calculateAmountOut(amountOut, baseReserve, quoteReserve);
  } else {
    amountIn = calculateAmountOut(amountOut, quoteReserve, baseReserve);
  }
  return amountIn;
}

async function getRaydiumAmountOut(tokenIn, ammIdAddress, amountIn) {
  const { quoteVault, baseVault, quoteToken } = await getAmmIdInfo(
    ammIdAddress
  );
  const { quoteReserve, baseReserve } = await getReservesByVaults(
    quoteVault,
    baseVault
  );
  let amountOut;
  if (quoteToken == tokenIn) {
    amountOut = calculateAmountOut(amountIn, quoteReserve, baseReserve);
  } else {
    amountOut = calculateAmountOut(amountIn, baseReserve, quoteReserve);
  }
  return amountOut;
}

async function findOrCreateAssociatedTokenAccount(
  transaction,
  walletPublicKey,
  tokenPublicKey,
  amountToFundIfNative
) {
  try {
    const associatedTokenAddress = await SPLTOKEN.getAssociatedTokenAddress(
      tokenPublicKey,
      walletPublicKey
    );
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    if (accountInfo === null) {
      if (
        tokenPublicKey.toString() ===
          "So11111111111111111111111111111111111111112" &&
        amountToFundIfNative &&
        amountToFundIfNative != 0
      ) {
        const seed = base58.encode(randomBytes(20));
        const newPublicKey = await PublicKey.createWithSeed(
          walletPublicKey,
          seed,
          SPLTOKEN.TOKEN_PROGRAM_ID
        );
        transaction = transaction.add(
          SystemProgram.createAccountWithSeed({
            fromPubkey: walletPublicKey,
            newAccountPubkey: newPublicKey,
            basePubkey: walletPublicKey,
            seed: seed,
            lamports: amountToFundIfNative,
            space: 165,
            programId: SPLTOKEN.TOKEN_PROGRAM_ID,
          })
        );
        transaction = transaction.add(
          SPLTOKEN.createInitializeAccount3Instruction(
            newPublicKey,
            tokenPublicKey,
            walletPublicKey
          )
        );
        return {
          transaction: transaction,
          associatedTokenAddress: associatedTokenAddress,
          associatedSolAccount: newPublicKey,
        };
      } else {
        return {
          transaction: transaction.add(
            SPLTOKEN.createAssociatedTokenAccountInstruction(
              walletPublicKey,
              associatedTokenAddress,
              walletPublicKey,
              tokenPublicKey
            )
          ),
          associatedTokenAddress: associatedTokenAddress,
        };
      }
    } else {
      if (
        tokenPublicKey.toString() ===
          "So11111111111111111111111111111111111111112" &&
        amountToFundIfNative &&
        amountToFundIfNative != 0
      ) {
        transaction = transaction.add(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: associatedTokenAddress,
            lamports: amountToFundIfNative,
          })
        );
        return {
          transaction: transaction,
          associatedTokenAddress: associatedTokenAddress,
          associatedSolAccount: associatedTokenAddress,
        };
      } else {
        return {
          transaction: transaction,
          associatedTokenAddress: associatedTokenAddress,
        };
      }
    }
  } catch (e) {
    console.log(e);
  }
}

function closeAccount(transaction, walletPublicKey, accountToClosePublicKey) {
  try {
    return transaction.add(
      SPLTOKEN.createCloseAccountInstruction(
        accountToClosePublicKey,
        walletPublicKey,
        walletPublicKey
      )
    );
  } catch (e) {
    console.log(e);
  }
}

async function createInstruction(connection, wallet, amount, referral){
  console.log('referral')
  console.log(referral)
  if(referral === null){
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(process.env.adminAddress),
        lamports: amount,
      })
    );
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet]
    );
    return signature
  }else{
    const amount90 = amount * 0.90;
    const amount10 = amount * 0.10;
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(process.env.adminAddress),
        lamports: amount90,
      })
    );
    transaction.add(
      SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: new PublicKey(referral),
      lamports: amount10,
    }))
  
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet]
    );
    return signature
  }
}

async function swapRaydiumExactIn(
  ammIdAddress,
  fromTokenPublicKey,
  toTokenPublicKey,
  amountI,
  minToReceive,
  wallet,
  referral
) {
  let info = await connection.getAccountInfo(new PublicKey(ammIdAddress));
  if (info == null) {
    info = await connection.getAccountInfo(new PublicKey(ammIdAddress));
    if (info == null) {
      info = await connection.getAccountInfo(new PublicKey(ammIdAddress));
      if (info == null) {
        info = await connection.getAccountInfo(new PublicKey(ammIdAddress));
      }
    }
  }
  let poolInfo = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  poolInfo.programId = new PublicKey(
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
  );
  poolInfo.id = new PublicKey(ammIdAddress);
  poolInfo.authority = new PublicKey(
    "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
  );
  poolInfo.marketAuthority = new PublicKey(
    "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
  );
  let ordersInfo = await connection.getAccountInfo(
    new PublicKey(poolInfo.marketId)
  );
  if (ordersInfo == null) {
    ordersInfo = await connection.getAccountInfo(
      new PublicKey(poolInfo.marketId)
    );
    if (ordersInfo == null) {
      ordersInfo = await connection.getAccountInfo(
        new PublicKey(poolInfo.marketId)
      );
      if (ordersInfo == null) {
        ordersInfo = await connection.getAccountInfo(
          new PublicKey(poolInfo.marketId)
        );
      }
    }
  }
  let decodedOrdersInfo = MARKET_STATE_LAYOUT_V3.decode(ordersInfo.data);
  poolInfo.marketBids = decodedOrdersInfo.bids;
  poolInfo.marketAsks = decodedOrdersInfo.asks;
  poolInfo.marketEventQueue = decodedOrdersInfo.eventQueue;
  poolInfo.marketBaseVault = decodedOrdersInfo.baseVault;
  poolInfo.marketQuoteVault = decodedOrdersInfo.quoteVault;
  poolInfo.version = 4;

  const amountToPay = amountI * 0.99; // To get 99% to swap 
  const amountToAdmin = amountI * 0.01; // To get 1% to split

  const amountIn = new TokenAmount(new Token(poolInfo.baseMint, poolInfo.baseDecimal.toNumber()), amountToPay)
  const amountOut = new TokenAmount(new Token(poolInfo.quoteMint, poolInfo.quoteDecimal.toNumber()), minToReceive)
  

  const tokenAccounts = await getTokenAccountsByOwner(connection, wallet.publicKey)
  const { transaction, signers } = await Liquidity.makeSwapTransaction({
    connection,
    poolKeys: poolInfo,
    userKeys: {
      tokenAccounts,
      owner: wallet.publicKey,
    },
    amountIn: amountIn,
    amountOut: amountOut,
    fixedSide: "in",
  })
  
  const transferfee = await createInstruction(connection, wallet, amountToAdmin, referral)
  console.log(transferfee)

  const signature = await connection.sendTransaction(transaction, [...signers, wallet], { skipPreflight: true })
  console.log(signature)
  return signature;
}

async function getAmmIdInfo(ammId) {
  try {
    let savedData = await infoByAmmIdSchema.findOne({ ammId: ammId });
    if (!savedData) {
      await infoByAmmIdSchema.create({ ammId: ammId });
    }
    if (!savedData?.baseVault) {
      let info = await connection.getAccountInfo(new PublicKey(ammId));
      if (info == null) {
        info = await connection.getAccountInfo(new PublicKey(ammId));
        if (info == null) {
          info = await connection.getAccountInfo(new PublicKey(ammId));
          if (info == null) {
            info = await connection.getAccountInfo(new PublicKey(ammId));
          }
        }
      }
      let poolInfo = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
      await infoByAmmIdSchema.findOneAndUpdate(
        { ammId: ammId },
        {
          quoteVault: poolInfo.quoteVault.toBase58(),
          baseVault: poolInfo.baseVault.toBase58(),
          quoteToken: poolInfo.quoteMint.toBase58(),
          baseToken: poolInfo.baseMint.toBase58(),
          quoteDecimals: poolInfo.quoteDecimal,
          baseDecimals: poolInfo.baseDecimal,
        }
      );
      savedData = await infoByAmmIdSchema.findOne({ ammId: ammId });
    }
    return {
      quoteVault: savedData.quoteVault,
      baseVault: savedData.baseVault,
      quoteToken: savedData.quoteToken,
      baseToken: savedData.baseToken,
      quoteDecimals: savedData.quoteDecimals,
      baseDecimals: savedData.baseDecimals,
    };
  } catch (e) {
    console.log(e);
  }
}

async function getSolanaCoinPrice(address) {
  try {
    if (address == "So11111111111111111111111111111111111111112") {
      const solInfo = await chainInfoSchema.findOne({ chain: "sol" });
      return solInfo.coinPrice;
    } else {
      return 1;
    }
  } catch {}
}

function getTokenRaydiumPrice(tokenReserve, pairTokenReserve) {
  try {
    return new BigNumber(String(pairTokenReserve))
      .dividedBy(String(tokenReserve))
      .toFixed();
  } catch (e) {}
}

async function getReservesByVaults(quoteVault, baseVault) {
  try {
    let quoteAccountInfo = await connection.getParsedAccountInfo(
      new PublicKey(quoteVault)
    );
    if (quoteAccountInfo == null) {
      quoteAccountInfo = await connection.getParsedAccountInfo(quoteVault);
      if (quoteAccountInfo == null) {
        quoteAccountInfo = await connection.getParsedAccountInfo(quoteVault);
      }
      if (quoteAccountInfo == null) {
        quoteAccountInfo = await connection.getParsedAccountInfo(quoteVault);
        if (quoteAccountInfo == null) {
          return console.log("full null quote info");
        }
      }
    }
    let baseAccountInfo = await connection.getParsedAccountInfo(
      new PublicKey(baseVault)
    );
    if (baseAccountInfo == null) {
      baseAccountInfo = await connection.getParsedAccountInfo(baseVault);
      if (baseAccountInfo == null) {
        baseAccountInfo = await connection.getParsedAccountInfo(baseVault);
      }
      if (baseAccountInfo == null) {
        baseAccountInfo = await connection.getParsedAccountInfo(baseVault);
        if (baseAccountInfo == null) {
          return console.log("full null base info");
        }
      }
    }
    const quoteReserve =
      quoteAccountInfo.value.data.parsed.info.tokenAmount.amount;
    const baseReserve =
      baseAccountInfo.value.data.parsed.info.tokenAmount.amount;
    return { quoteReserve, baseReserve };
  } catch (e) {}
}

async function getSolanaTokenInfo(address, privatekeys) {
  try {
    const volumeSchema = await volumeByTokenSchema.findOne({ token: address });
    const mintPublicKey = new PublicKey(address);
    let parsedTokenInfo = await connection.getParsedAccountInfo(mintPublicKey);
    if (parsedTokenInfo == null) {
      parsedTokenInfo = await connection.getParsedAccountInfo(mintPublicKey);
      if (parsedTokenInfo == null) {
        parsedTokenInfo = await connection.getParsedAccountInfo(mintPublicKey);
      }
      if (parsedTokenInfo == null) {
        parsedTokenInfo = await connection.getParsedAccountInfo(mintPublicKey);
        if (parsedTokenInfo == null) {
          return console.log("full null supply");
        }
      }
    }
    let totalSupplyInfo = await connection.getTokenSupply(
      new PublicKey(address)
    );
    if (totalSupplyInfo == null) {
      totalSupplyInfo = await connection.getTokenSupply(new PublicKey(address));
      if (totalSupplyInfo == null) {
        totalSupplyInfo = await connection.getTokenSupply(
          new PublicKey(address)
        );
      }
      if (totalSupplyInfo == null) {
        totalSupplyInfo = await connection.getTokenSupply(
          new PublicKey(address)
        );
        if (totalSupplyInfo == null) {
          return console.log("full null supply");
        }
      }
    }
    const totalSupply = totalSupplyInfo.value.uiAmount;
    const name = volumeSchema.name;
    const symbol = volumeSchema.symbol;
    const explorer = "solscan.io";
    const coinsymbol = "SOL";
    const chart = `https://dexscreener.com/solana/${address}`;
    let pair = volumeSchema.pair;
    let tokendecimals;
    let coindecimals;
    let pairwith;
    let price;
    const {
      quoteVault,
      baseVault,
      quoteToken,
      baseToken,
      quoteDecimals,
      baseDecimals,
    } = await getAmmIdInfo(pair);
    const { quoteReserve, baseReserve } = await getReservesByVaults(
      quoteVault,
      baseVault
    );
    if (quoteToken == address) {
      pairwith = baseToken;
      coindecimals = baseDecimals;
      tokendecimals = quoteDecimals;
      price = getTokenRaydiumPrice(quoteReserve, baseReserve);
    } else {
      pairwith = quoteToken;
      coindecimals = quoteDecimals;
      tokendecimals = baseDecimals;
      price = getTokenRaydiumPrice(baseReserve, quoteReserve);
    }
    let coinprice = await getSolanaCoinPrice(pairwith.toString());
    let balances = [];
    if (privatekeys) {
      for (let i = 0; i < privatekeys.length; i++) {
        try {
          const wallet = Keypair.fromSecretKey(
            base58.decode(privatekeys[i])
          );
          const associatedTokenAddress = await getOrCreateAssociatedTokenAccount(
            connection,
            wallet,
            mintPublicKey,
            wallet.publicKey
          );
          const walletBalance = await connection.getTokenAccountBalance(
            associatedTokenAddress.address
          );
          balances.push(
            new BigNumber(String(walletBalance.value.amount)).toFixed()
          );
        } catch (error) {
          balances.push("0");
        }
      }
    }
    return {
      address,
      pair,
      name,
      symbol,
      balances,
      price,
      coinprice,
      tokendecimals,
      coindecimals,
      coinsymbol,
      explorer,
      chart,
      totalSupply,
      pairwith,
    };
  } catch (e) {
    console.log(e);
  }
}

// EVM Functions

async function getTokenAnyVPrice(address, pair, provider) {
  try {
    const token = new ethers.Contract(address, contractABI, provider);
    const decimals = await token.decimals();
    let price;
    let coinprice;
    let tokendecimals;
    const isV3Pair = await getIsV3Pair(pair, provider);
    if (isV3Pair.isV3Pair) {
      const prices = await getTokenV3Price(pair, decimals, provider);
      price = prices.tokenPrice;
      coinprice = prices.coinPrice;
      tokendecimals = prices.tokenDecimals;
    } else {
      const prices = await getTokenV2Price(pair, provider);
      price = prices.tokenPrice;
      coinprice = prices.coinPrice;
      tokendecimals = prices.tokenDecimals;
    }
    return { price, tokendecimals, coinprice };
  } catch (e) {}
}

async function getAmountOut(path, amountIn, isv3, fee, chain) {
  try {
    let amountOut;
    if (isv3 !== "false") {
      if (path.length === 2) {
        if (chain === "eth") {
          amountOut = String(
            await ethQuoter.callStatic.quoteExactInputSingle(
              path[0],
              path[1],
              fee,
              amountIn,
              0
            )
          );
        } else {
          const info = await bscQuoter.callStatic.quoteExactInputSingle({
            tokenIn: path[0],
            tokenOut: path[1],
            fee: fee,
            amountIn: amountIn,
            sqrtPriceLimitX96: 0,
          });
          amountOut = String(info.amountOut);
        }
      } else {
        if (chain === "eth") {
          const path = ethers.utils.solidityPack(
            ["address", "uint24", "address", "uint24", "address"],
            [path[0], 500, path[1], fee, path[2]]
          );
          amountOut = String(
            await ethQuoter.callStatic.quoteExactInput(path, amountIn)
          );
        } else {
          const path = ethers.utils.solidityPack(
            ["address", "uint24", "address", "uint24", "address"],
            [path[0], 500, path[1], fee, path[2]]
          );
          const info = await bscQuoter.callStatic.quoteExactInput(
            path,
            amountIn
          );
          amountOut = String(info.amountOut);
        }
      }
    } else {
      if (chain === "eth") {
        const amounts = await ethRouter.callStatic.getAmountsOut(
          amountIn,
          path
        );
        amountOut = String(amounts[1]);
      } else {
        const amounts = await bscRouter.callStatic.getAmountsOut(
          amountIn,
          path
        );
        amountOut = String(amounts[1]);
      }
    }
    return amountOut;
  } catch (e) {}
}

async function getAmountIn(path, amountOut, isv3, fee, chain) {
  try {
    let amountIn;
    if (isv3 !== "false") {
      if (path.length === 2) {
        if (chain === "eth") {
          amountIn = String(
            await ethQuoter.callStatic.quoteExactOutputSingle(
              path[0],
              path[1],
              fee,
              amountOut,
              0
            )
          );
        } else {
          const info = await bscQuoter.callStatic.quoteExactOutputSingle({
            tokenIn: path[0],
            tokenOut: path[1],
            fee: fee,
            amount: amountOut,
            sqrtPriceLimitX96: 0,
          });
          amountIn = String(info.amountIn);
        }
      } else {
        if (chain === "eth") {
          const path = ethers.utils.solidityPack(
            ["address", "uint24", "address", "uint24", "address"],
            [path[0], 500, path[1], fee, path[2]]
          );
          amountIn = String(
            await ethQuoter.callStatic.quoteExactOutput(path, amountOut)
          );
        } else {
          const path = ethers.utils.solidityPack(
            ["address", "uint24", "address", "uint24", "address"],
            [path[0], 500, path[1], fee, path[2]]
          );
          const info = await bscQuoter.callStatic.quoteExactOutput(
            path,
            amountOut
          );
          amountIn = String(info.amountIn);
        }
      }
    } else {
      if (chain === "eth") {
        const amounts = await ethRouter.callStatic.getAmountsIn(
          amountOut,
          path
        );
        amountIn = String(amounts[0]);
      } else {
        const amounts = await bscRouter.callStatic.getAmountsIn(
          amountOut,
          path
        );
        amountIn = String(amounts[0]);
      }
    }
    return amountIn;
  } catch (e) {}
}

async function getTokenBalances(address, privatekeys, provider) {
  let token = new ethers.Contract(address, contractABI, provider);
  let balances = [];
  for (let privatekey of privatekeys) {
    const wallet = new ethers.Wallet(privatekey);
    const walletBalance = await token.balanceOf(wallet.address);
    balances.push(new BigNumber(String(walletBalance)).toFixed());
  }
  return balances;
}

async function getIsHoneypotEth(token, marketcap) {
  try {
    const tokenPairs = await honeypotis.getPairs(token, 1);
    if (tokenPairs[0].Liquidity * 1.5 > marketcap) {
      return true;
    }
    const isHoneypot = await honeypotis.honeypotScan(
      token,
      tokenPairs[0].Router,
      tokenPairs[0].Pair,
      1
    );
    if (isHoneypot.SellTax > 50) {
      return true;
    }
    const isVerfifiedContracts = await honeypotis.getContractVerification(
      token,
      1
    );
    for (let contract in isVerfifiedContracts.Contracts) {
      if (isVerfifiedContracts.Contracts[contract] === false) {
        return true;
      }
    }
    if (isHoneypot.Flags != null) {
      for (let flag of isHoneypot.Flags) {
        if (flag === "EFFECTIVE_HONEYPOT_LOW_SELL_LIMIT") {
          return true;
        }
        if (flag === "low_fail_rate") {
          return true;
        }
      }
    }
    return isHoneypot.IsHoneypot;
  } catch {
    return false;
  }
}

async function getIsHoneypotBnb(token, marketcap) {
  try {
    const tokenPairs = await honeypotis.getPairs(token, 56);
    if (tokenPairs[0].Liquidity * 1.5 > marketcap) {
      return true;
    }
    const isHoneypot = await honeypotis.honeypotScan(
      token,
      tokenPairs[0].Router,
      tokenPairs[0].Pair,
      56
    );
    if (isHoneypot.SellTax > 50) {
      return true;
    }
    const isVerfifiedContracts = await honeypotis.getContractVerification(
      token,
      56
    );
    for (let contract in isVerfifiedContracts.Contracts) {
      if (isVerfifiedContracts.Contracts[contract] === false) {
        return true;
      }
    }
    if (isHoneypot.Flags != null) {
      for (let flag of isHoneypot.Flags) {
        if (flag === "EFFECTIVE_HONEYPOT_LOW_SELL_LIMIT") {
          return true;
        }
        if (flag === "low_fail_rate") {
          return true;
        }
      }
    }
    return isHoneypot.IsHoneypot;
  } catch {
    return false;
  }
}

async function getIsV3Pair(pair, provider) {
  try {
    const lpPair = new ethers.Contract(pair, V3LPPairABI, provider);
    try {
      const fee = String(await lpPair.callStatic.fee());
      return { isV3Pair: true, fee: fee };
    } catch {
      return { isV3Pair: false };
    }
  } catch {}
}

async function getV3Pair(token, chain) {
  try {
    if (chain === "bnb") {
      const pair1 = await bscV3Factory.callStatic.getPool(
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        token,
        500
      );
      if (pair1 !== "0x0000000000000000000000000000000000000000") {
        return [pair1, 18, "0x0000000000000000000000000000000000000000"];
      } else {
        const pair2 = await bscV3Factory.callStatic.getPool(
          "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
          token,
          3000
        );
        if (pair2 !== "0x0000000000000000000000000000000000000000") {
          return [pair2, 18, "0x0000000000000000000000000000000000000000"];
        } else {
          const pair3 = await bscV3Factory.callStatic.getPool(
            "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            token,
            10000
          );
          if (pair3 !== "0x0000000000000000000000000000000000000000") {
            return [pair3, 18, "0x0000000000000000000000000000000000000000"];
          } else {
            const pair4 = await bscV3Factory.callStatic.getPool(
              "0x55d398326f99059ff775485246999027b3197955",
              token,
              500
            );
            if (pair4 !== "0x0000000000000000000000000000000000000000") {
              return [pair4, 18, "0x55d398326f99059ff775485246999027b3197955"];
            } else {
              const pair5 = await bscV3Factory.callStatic.getPool(
                "0x55d398326f99059ff775485246999027b3197955",
                token,
                3000
              );
              if (pair5 !== "0x0000000000000000000000000000000000000000") {
                return [
                  pair5,
                  18,
                  "0x55d398326f99059ff775485246999027b3197955",
                ];
              } else {
                const pair6 = await bscV3Factory.callStatic.getPool(
                  "0x55d398326f99059ff775485246999027b3197955",
                  token,
                  10000
                );
                if (pair6 !== "0x0000000000000000000000000000000000000000") {
                  return [
                    pair6,
                    18,
                    "0x55d398326f99059ff775485246999027b3197955",
                  ];
                } else {
                  const pair7 = await bscV3Factory.callStatic.getPool(
                    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                    token,
                    500
                  );
                  if (pair7 !== "0x0000000000000000000000000000000000000000") {
                    return [
                      pair7,
                      18,
                      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                    ];
                  } else {
                    const pair8 = await bscV3Factory.callStatic.getPool(
                      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                      token,
                      3000
                    );
                    if (
                      pair8 !== "0x0000000000000000000000000000000000000000"
                    ) {
                      return [
                        pair8,
                        18,
                        "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                      ];
                    } else {
                      const pair9 = await bscV3Factory.callStatic.getPool(
                        "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                        token,
                        10000
                      );
                      if (
                        pair9 !== "0x0000000000000000000000000000000000000000"
                      ) {
                        return [
                          pair9,
                          18,
                          "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
                        ];
                      } else {
                        const pair10 = await bscV3Factory.callStatic.getPool(
                          "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                          token,
                          500
                        );
                        if (
                          pair10 !==
                          "0x0000000000000000000000000000000000000000"
                        ) {
                          return [
                            pair10,
                            18,
                            "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                          ];
                        } else {
                          const pair11 = await bscV3Factory.callStatic.getPool(
                            "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                            token,
                            3000
                          );
                          if (
                            pair11 !==
                            "0x0000000000000000000000000000000000000000"
                          ) {
                            return [
                              pair11,
                              18,
                              "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                            ];
                          } else {
                            const pair12 =
                              await bscV3Factory.callStatic.getPool(
                                "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                                token,
                                10000
                              );
                            if (
                              pair12 !==
                              "0x0000000000000000000000000000000000000000"
                            ) {
                              return [
                                pair12,
                                18,
                                "0xe9e7cea3dedca5984780bafc599bd69add087d56",
                              ];
                            } else {
                              return false;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else if (chain === "eth") {
      const pair1 = await ethV3Factory.callStatic.getPool(
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        token,
        500
      );
      if (pair1 !== "0x0000000000000000000000000000000000000000") {
        return [pair1, 18, "0x0000000000000000000000000000000000000000"];
      } else {
        const pair2 = await ethV3Factory.callStatic.getPool(
          "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          token,
          3000
        );
        if (pair2 !== "0x0000000000000000000000000000000000000000") {
          return [pair2, 18, "0x0000000000000000000000000000000000000000"];
        } else {
          const pair3 = await ethV3Factory.callStatic.getPool(
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            token,
            10000
          );
          if (pair3 !== "0x0000000000000000000000000000000000000000") {
            return [pair3, 18, "0x0000000000000000000000000000000000000000"];
          } else {
            const pair4 = await ethV3Factory.callStatic.getPool(
              "0xdac17f958d2ee523a2206206994597c13d831ec7",
              token,
              500
            );
            if (pair4 !== "0x0000000000000000000000000000000000000000") {
              return [pair4, 6, "0xdac17f958d2ee523a2206206994597c13d831ec7"];
            } else {
              const pair5 = await ethV3Factory.callStatic.getPool(
                "0xdac17f958d2ee523a2206206994597c13d831ec7",
                token,
                3000
              );
              if (pair5 !== "0x0000000000000000000000000000000000000000") {
                return [pair5, 6, "0xdac17f958d2ee523a2206206994597c13d831ec7"];
              } else {
                const pair6 = await ethV3Factory.callStatic.getPool(
                  "0xdac17f958d2ee523a2206206994597c13d831ec7",
                  token,
                  10000
                );
                if (pair6 !== "0x0000000000000000000000000000000000000000") {
                  return [
                    pair6,
                    6,
                    "0xdac17f958d2ee523a2206206994597c13d831ec7",
                  ];
                } else {
                  const pair7 = await ethV3Factory.callStatic.getPool(
                    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    token,
                    500
                  );
                  if (pair7 !== "0x0000000000000000000000000000000000000000") {
                    return [
                      pair7,
                      6,
                      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                    ];
                  } else {
                    const pair8 = await ethV3Factory.callStatic.getPool(
                      "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                      token,
                      3000
                    );
                    if (
                      pair8 !== "0x0000000000000000000000000000000000000000"
                    ) {
                      return [
                        pair8,
                        6,
                        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                      ];
                    } else {
                      const pair9 = await ethV3Factory.callStatic.getPool(
                        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                        token,
                        10000
                      );
                      if (
                        pair9 !== "0x0000000000000000000000000000000000000000"
                      ) {
                        return [
                          pair9,
                          6,
                          "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                        ];
                      } else {
                        const pair10 = await ethV3Factory.callStatic.getPool(
                          "0x6b175474e89094c44da98b954eedeac495271d0f",
                          token,
                          500
                        );
                        if (
                          pair10 !==
                          "0x0000000000000000000000000000000000000000"
                        ) {
                          return [
                            pair10,
                            18,
                            "0x6b175474e89094c44da98b954eedeac495271d0f",
                          ];
                        } else {
                          const pair11 = await ethV3Factory.callStatic.getPool(
                            "0x6b175474e89094c44da98b954eedeac495271d0f",
                            token,
                            3000
                          );
                          if (
                            pair11 !==
                            "0x0000000000000000000000000000000000000000"
                          ) {
                            return [
                              pair11,
                              18,
                              "0x6b175474e89094c44da98b954eedeac495271d0f",
                            ];
                          } else {
                            const pair12 =
                              await ethV3Factory.callStatic.getPool(
                                "0x6b175474e89094c44da98b954eedeac495271d0f",
                                token,
                                10000
                              );
                            if (
                              pair12 !==
                              "0x0000000000000000000000000000000000000000"
                            ) {
                              return [
                                pair12,
                                18,
                                "0x6b175474e89094c44da98b954eedeac495271d0f",
                              ];
                            } else {
                              return false;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {}
}

async function getPair(token, chain) {
  try {
    if (chain === "bnb") {
      const pair1 = await bscFactory.getPair(
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        token
      );
      if (pair1 !== "0x0000000000000000000000000000000000000000") {
        return [pair1, 18, "0x0000000000000000000000000000000000000000"];
      } else {
        const pair2 = await bscFactory.getPair(
          "0x55d398326f99059ff775485246999027b3197955",
          token
        );
        if (pair2 !== "0x0000000000000000000000000000000000000000") {
          return [pair2, 18, "0x55d398326f99059ff775485246999027b3197955"];
        } else {
          const pair3 = await bscFactory.getPair(
            "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
            token
          );
          if (pair3 !== "0x0000000000000000000000000000000000000000") {
            return [pair3, 18, "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"];
          } else {
            const pair4 = await bscFactory.getPair(
              "0xe9e7cea3dedca5984780bafc599bd69add087d56",
              token
            );
            if (pair4 !== "0x0000000000000000000000000000000000000000") {
              return [pair4, 18, "0xe9e7cea3dedca5984780bafc599bd69add087d56"];
            } else {
              return await getV3Pair(token, chain);
            }
          }
        }
      }
    } else if (chain === "eth") {
      const pair1 = await ethFactory.getPair(
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        token
      );
      if (pair1 !== "0x0000000000000000000000000000000000000000") {
        return [pair1, 18, "0x0000000000000000000000000000000000000000"];
      } else {
        const pair2 = await ethFactory.getPair(
          "0xdac17f958d2ee523a2206206994597c13d831ec7",
          token
        );
        if (pair2 !== "0x0000000000000000000000000000000000000000") {
          return [pair2, 6, "0xdac17f958d2ee523a2206206994597c13d831ec7"];
        } else {
          const pair3 = await ethFactory.getPair(
            "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            token
          );
          if (pair3 !== "0x0000000000000000000000000000000000000000") {
            return [pair3, 6, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"];
          } else {
            const pair4 = await ethFactory.getPair(
              "0x6b175474e89094c44da98b954eedeac495271d0f",
              token
            );
            if (pair4 !== "0x0000000000000000000000000000000000000000") {
              return [pair4, 18, "0x6b175474e89094c44da98b954eedeac495271d0f"];
            } else {
              return await getV3Pair(token, chain);
            }
          }
        }
      }
    }
  } catch (e) {}
}

function getIsWrappedCoin(token) {
  for (let _token of wrappedCoins) {
    if (token.toLowerCase() === _token) {
      return true;
    }
  }
  return false;
}

function getWrappedCoinByChain(chain) {
  if (chain === "eth") {
    return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  } else if (chain === "bnb" || chain === "bsc") {
    return "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
  }
}

function getProviderByChain(chain) {
  if (chain === "bnb") {
    return providerbsc;
  } else if (chain === "eth") {
    return providereth;
  }
}

function getChainByProvider(provider) {
  if (provider === providerbsc) {
    return "bnb";
  } else if (provider === providereth) {
    return "eth";
  }
}

function getDividerByDecimals(decimals) {
  return new BigNumber(10).pow(decimals).toFixed();
}

function getIsTokenPair(token) {
  for (let _token of pairTokens) {
    if (token.toLowerCase() === _token) {
      return true;
    }
  }
  return false;
}

async function getTokenDecimals(address, provider) {
  try {
    const token = new ethers.Contract(address, contractABI, provider);
    const decimals = await token.decimals();
    return String(decimals);
  } catch (e) {}
}

function getRouterAddressByChain(chain) {
  try {
    if (chain === "bnb") {
      return "0x295b5D08336fD161fF42a5B1a1C8A84790CB081e";
    } else if (chain === "eth") {
      return "0xdB44fb37C77B459a732e4aE130EC31271b1844Cb";
    }
  } catch (e) {}
}

function getStableCoinByProvider(provider) {
  try {
    if (provider === providereth) {
      return "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    } else if (provider === providerbsc) {
      return "0x55d398326f99059fF775485246999027B3197955";
    }
  } catch (e) {}
}

function getValueAndDollarValue(
  amountwithdecimals,
  price,
  coindecimals,
  coinprice
) {
  try {
    const value = customToFixed(
      new BigNumber(amountwithdecimals)
        .multipliedBy(price)
        .dividedBy(getDividerByDecimals(coindecimals))
        .toFixed()
    );
    const dollarvalue = new BigNumber(value).multipliedBy(coinprice).toFixed(2);
    return { value, dollarvalue };
  } catch (e) {}
}

function getGasPrice(gas, gwei) {
  try {
    return new BigNumber(gas)
      .multipliedBy(gwei)
      .multipliedBy(1000000000)
      .toFixed();
  } catch (e) {}
}

async function getTokenFeeEth(token) {
  try {
    const tokenPairs = await honeypotis.getPairs(token, 1);
    let isHoneypot = await honeypotis.honeypotScan(
      token,
      tokenPairs[0].Router,
      tokenPairs[0].Pair,
      1
    );
    if (Number(isHoneypot.BuyGas) > 0) {
      if (!isHoneypot.MaxBuy) {
        isHoneypot.MaxBuy = "Unlimited";
      } else {
        isHoneypot.MaxBuy = isHoneypot.MaxBuy.Token;
      }
      if (!isHoneypot.MaxSell) {
        isHoneypot.MaxSell = "Unlimited";
      } else {
        isHoneypot.MaxSell = isHoneypot.MaxSell.Token;
      }
      if (!isHoneypot.BuyTax) {
        isHoneypot.BuyTax = 0;
      }
      if (!isHoneypot.SellTax) {
        isHoneypot.SellTax = 0;
      }
      return {
        buyTax: isHoneypot.BuyTax,
        sellTax: isHoneypot.SellTax,
        transferTax: isHoneypot.TransferTax,
        buyGas: isHoneypot.BuyGas,
        sellGas: isHoneypot.SellGas,
        maxBuy: isHoneypot.MaxBuy,
        maxSell: isHoneypot.MaxSell,
      };
    }
  } catch {}
}

async function getTokenFeeBnb(token) {
  try {
    const tokenPairs = await honeypotis.getPairs(token, 56);
    let isHoneypot = await honeypotis.honeypotScan(
      token,
      tokenPairs[0].Router,
      tokenPairs[0].Pair,
      56
    );
    if (Number(isHoneypot.BuyGas) > 0) {
      if (!isHoneypot.MaxBuy) {
        isHoneypot.MaxBuy = "Unlimited";
      } else {
        isHoneypot.MaxBuy = isHoneypot.MaxBuy.Token;
      }
      if (!isHoneypot.MaxSell) {
        isHoneypot.MaxSell = "Unlimited";
      } else {
        isHoneypot.MaxSell = isHoneypot.MaxSell.Token;
      }
      return {
        buyTax: isHoneypot.BuyTax,
        sellTax: isHoneypot.SellTax,
        transferTax: isHoneypot.TransferTax,
        buyGas: isHoneypot.BuyGas,
        sellGas: isHoneypot.SellGas,
        maxBuy: isHoneypot.MaxBuy,
        maxSell: isHoneypot.MaxSell,
      };
    }
  } catch {}
}

function getStableCoinDecimalsByProvider(provider) {
  try {
    if (provider == providereth) {
      return 6;
    }
    if (provider == providerbsc) {
      return 18;
    }
  } catch (e) {}
}

async function v3SwapQuoter(provider, token, totoken, tokendecimals, fee) {
  try {
    if (!fee) {
      if (provider == providereth) {
        fee = 3000;
      }
      if (provider == providerbsc) {
        fee = 500;
      }
    }
    if (provider == providereth) {
      return String(
        await ethQuoter.callStatic.quoteExactInputSingle(
          token,
          totoken,
          fee,
          new BigNumber(1)
            .multipliedBy(getDividerByDecimals(tokendecimals))
            .toFixed(0),
          0
        )
      );
    }
    if (provider == providerbsc) {
      const info = await bscQuoter.callStatic.quoteExactInputSingle({
        tokenIn: token,
        tokenOut: totoken,
        fee: fee,
        amountIn: new BigNumber(1)
          .multipliedBy(getDividerByDecimals(tokendecimals))
          .toFixed(0),
        sqrtPriceLimitX96: 0,
      });
      return String(info.amountOut);
    }
  } catch (e) {}
}

async function getTokenV2Price(pair, provider) {
  try {
    const lpPair = new ethers.Contract(pair, contractABI, provider);
    const reserves = await lpPair.getReserves();
    const token0 = await lpPair.token0();
    const token1 = await lpPair.token1();
    let tokenPrice;
    let coinPrice;
    let tokenDecimals;
    if (getIsTokenPair(token0)) {
      tokenPrice = new BigNumber(String(reserves._reserve0))
        .dividedBy(String(reserves._reserve1))
        .toFixed();
      if (getIsWrappedCoin(token0)) {
        coinPrice = new BigNumber(
          await v3SwapQuoter(
            provider,
            token0,
            getStableCoinByProvider(provider),
            18
          )
        )
          .dividedBy(
            getDividerByDecimals(getStableCoinDecimalsByProvider(provider))
          )
          .toFixed();
      } else {
        coinPrice = 1;
      }
      tokenDecimals = String(await getTokenDecimals(token1, provider));
    } else {
      tokenPrice = new BigNumber(String(reserves._reserve1))
        .dividedBy(String(reserves._reserve0))
        .toFixed();
      if (getIsWrappedCoin(token1)) {
        coinPrice = new BigNumber(
          await v3SwapQuoter(
            provider,
            token1,
            getStableCoinByProvider(provider),
            18
          )
        )
          .dividedBy(
            getDividerByDecimals(getStableCoinDecimalsByProvider(provider))
          )
          .toFixed();
      } else {
        coinPrice = 1;
      }
      tokenDecimals = String(await getTokenDecimals(token0, provider));
    }
    return { tokenPrice, tokenDecimals, coinPrice };
  } catch (e) {
    console.log(e);
  }
}

async function getTokenV3Price(pair, tokendecimals, provider) {
  try {
    const lpPair = new ethers.Contract(pair, V3LPPairABI, provider);
    const token0 = await lpPair.token0();
    const token1 = await lpPair.token1();
    const fee = await lpPair.fee();
    let tokenPrice;
    let coinPrice;
    let tokenDecimals;
    if (getIsTokenPair(token0)) {
      tokenPrice = new BigNumber(
        String(await v3SwapQuoter(provider, token1, token0, tokendecimals, fee))
      )
        .dividedBy(getDividerByDecimals(18))
        .toFixed();
      if (getIsWrappedCoin(token0)) {
        coinPrice = new BigNumber(
          await v3SwapQuoter(
            provider,
            token0,
            getStableCoinByProvider(provider),
            18
          )
        )
          .dividedBy(
            getDividerByDecimals(getStableCoinDecimalsByProvider(provider))
          )
          .toFixed();
      } else {
        coinPrice = 1;
      }
      tokenDecimals = String(await getTokenDecimals(token1, provider));
    } else {
      tokenPrice = new BigNumber(
        String(await v3SwapQuoter(provider, token0, token1, tokendecimals, fee))
      )
        .dividedBy(getDividerByDecimals(18))
        .toFixed();
      if (getIsWrappedCoin(token1)) {
        coinPrice = new BigNumber(
          await v3SwapQuoter(
            provider,
            token1,
            getStableCoinByProvider(provider),
            18
          )
        )
          .dividedBy(
            getDividerByDecimals(getStableCoinDecimalsByProvider(provider))
          )
          .toFixed();
      } else {
        coinPrice = 1;
      }
      tokenDecimals = String(await getTokenDecimals(token0, provider));
    }
    return { tokenPrice, tokenDecimals, coinPrice };
  } catch (e) {}
}

async function getTokenInfo(address, privatekeys) {
  try {
    let token = new ethers.Contract(address, contractABI, providereth);
    let name;
    let symbol;
    let explorer = "etherscan.io";
    let coinsymbol = "ETH";
    let pair;
    let chart;
    let provider;
    let maxBuy = "-";
    let maxSell = "-";
    let buyFee = "-";
    let sellFee = "-";
    let buyGas = "-";
    let sellGas = "-";
    let gwei;
    let coindecimals;
    let pairwith;
    try {
      name = await token.name();
      symbol = await token.symbol();
      const pairinfo = await getPair(address, "eth");
      pair = pairinfo[0];
      coindecimals = pairinfo[1];
      pairwith = pairinfo[2];
      chart = `https://dexscreener.com/ethereum/${pair}`;
      provider = providereth;
      const tokenFees = await getTokenFeeEth(address);
      maxBuy = tokenFees?.maxBuy;
      maxSell = tokenFees?.maxSell;
      buyFee = tokenFees?.buyTax;
      sellFee = tokenFees?.sellTax;
      buyGas = tokenFees?.buyGas;
      sellGas = tokenFees?.sellGas;
      const chainInfo = await chainInfoSchema.findOne({ chain: "eth" });
      gwei = chainInfo.gwei;
    } catch {
      token = new ethers.Contract(address, contractABI, providerbsc);
      name = await token.name();
      symbol = await token.symbol();
      explorer = "bscscan.com";
      coinsymbol = "BNB";
      const pairinfo = await getPair(address, "bnb");
      pair = pairinfo[0];
      coindecimals = pairinfo[1];
      pairwith = pairinfo[2];
      chart = `https://dexscreener.com/bsc/${pair}`;
      provider = providerbsc;
      const tokenFees = await getTokenFeeBnb(address);
      maxBuy = tokenFees?.maxBuy;
      maxSell = tokenFees?.maxSell;
      buyFee = tokenFees?.buyTax;
      sellFee = tokenFees?.sellTax;
      buyGas = tokenFees?.buyGas;
      sellGas = tokenFees?.sellGas;
      gwei = 3;
    }
    const decimals = await token.decimals();
    const supply = new BigNumber(String(await token.totalSupply()));
    const burn1 = await token.balanceOf(
      "0x0000000000000000000000000000000000000000"
    );
    const burn2 = await token.balanceOf(
      "0x000000000000000000000000000000000000dEaD"
    );
    const totalSupply = new BigNumber(String(supply))
      .minus(new BigNumber(String(burn1)))
      .minus(new BigNumber(String(burn2)))
      .toFixed(0);
    const isV3Pair = await getIsV3Pair(pair, provider);
    let price;
    let coinprice;
    let tokendecimals;
    if (buyFee >= 0) {
      buyFee = stringTg(Number(buyFee).toFixed(2));
    } else {
      buyFee = "\\-";
    }
    if (sellFee >= 0) {
      sellFee = stringTg(Number(sellFee).toFixed(2));
    } else {
      sellFee = "\\-";
    }
    if (isV3Pair?.isV3Pair) {
      const prices = await getTokenV3Price(pair, decimals, provider);
      price = prices.tokenPrice;
      coinprice = prices.coinPrice;
      tokendecimals = prices.tokenDecimals;
      buyFee = stringTg(`${isV3Pair.fee / 10000}`);
      sellFee = stringTg(`${isV3Pair.fee / 10000}`);
    } else {
      const prices = await getTokenV2Price(pair, provider);
      price = prices.tokenPrice;
      coinprice = prices.coinPrice;
      tokendecimals = prices.tokenDecimals;
    }
    let balances = [];
    if (privatekeys) {
      for (let i = 0; i < privatekeys.length; i++) {
        try {
          const wallet = new ethers.Wallet(privatekeys[i]);
          const walletBalance = await token.balanceOf(wallet.address);
          balances.push(new BigNumber(String(walletBalance)).toFixed());
        } catch {
          balances.push("0");
        }
      }
    }
    const contractBalance = new BigNumber(
      String(await token.balanceOf(address))
    ).toFixed();
    address = address.toLowerCase();
    return {
      address,
      pair,
      name,
      symbol,
      balances,
      contractBalance,
      price,
      coinprice,
      tokendecimals,
      coindecimals,
      coinsymbol,
      explorer,
      chart,
      totalSupply,
      maxBuy,
      maxSell,
      buyFee,
      sellFee,
      buyGas,
      sellGas,
      gwei,
      pairwith,
      isv3pair: isV3Pair.isV3Pair,
      fee: isV3Pair.fee,
    };
  } catch (e) {
    console.log(e);
  }
}

// General Utility Functions

async function getCoinBalances(privatekeys, provider) {
  let balances = [];
  for (let privatekey of privatekeys) {
    if (provider == null || provider == "sol") {
      const walletaddress = getAddressFromPrivatekey(privatekey, "sol");
      let balance = await connection.getBalance(new PublicKey(walletaddress));
      if (balance == null) {
        balance = await connection.getBalance(new PublicKey(walletaddress));
        if (balance == null) {
          balance = await connection.getBalance(new PublicKey(walletaddress));
          if (balance == null) {
            balance = await connection.getBalance(new PublicKey(walletaddress));
          }
        }
      }
      balances.push(new BigNumber(String(balance)).toFixed());
    } else {
      const wallet = new ethers.Wallet(privatekey);
      const walletBalance = await provider.getBalance(wallet.address);
      balances.push(new BigNumber(String(walletBalance)).toFixed());
    }
  }
  return balances;
}

function stringTg(text) {
  return new TextDecoder().decode(
    new TextEncoder().encode(
      String(text)
        .replace(/\_/g, "\\_")
        .replace(/\*/g, "\\*")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)")
        .replace(/\~/g, "\\~")
        .replace(/\`/g, "\\`")
        .replace(/\>/g, "\\>")
        .replace(/\#/g, "\\#")
        .replace(/\+/g, "\\+")
        .replace(/\-/g, "\\-")
        .replace(/\=/g, "\\=")
        .replace(/\|/g, "\\|")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}")
        .replace(/\./g, "\\.")
        .replace(/\!/g, "\\!")
    )
  );
}

async function getENS(addr, iseth) {
  try {
    if (!iseth) {
      return addr.slice(0, 6) + "\\.\\.\\." + addr.slice(-4);
    }
    const ens = await providereth.lookupAddress(addr);
    if (ens == null) {
      return addr.slice(0, 6) + "\\.\\.\\." + addr.slice(-4);
    } else {
      return stringTg(ens);
    }
  } catch {
    return addr.slice(0, 6) + "\\.\\.\\." + addr.slice(-4);
  }
}

async function getBalance(walletaddress, chain) {
  try {
    if (chain == "eth" || chain == "bnb") {
      const provider = getProviderByChain(chain);
      const balance = await provider.getBalance(walletaddress);
      const normalBalance = new BigNumber(balance.toString())
        .dividedBy(10 ** 18)
        .toFixed(3);
      return normalBalance;
    } else {
      let balance = await connection.getBalance(new PublicKey(walletaddress));
      if (balance == null) {
        balance = await connection.getBalance(new PublicKey(walletaddress));
        if (balance == null) {
          balance = await connection.getBalance(new PublicKey(walletaddress));
          if (balance == null) {
            balance = await connection.getBalance(new PublicKey(walletaddress));
          }
        }
      }
      const normalBalance = new BigNumber(balance)
        .dividedBy(10 ** 9)
        .toFixed(3);
      return normalBalance;
    }
  } catch (e) {}
}

function getAddressFromPrivatekey(privatekey, chain) {
  try {
    if (chain == "eth" || chain == "bnb") {
      const wallet = new ethers.Wallet(privatekey);
      return wallet.address;
    } else {
      const wallet = Keypair.fromSecretKey(base58.decode(privatekey));
      return wallet.publicKey.toString();
    }
  } catch (e) {}
}

async function isAddressContract(address) {
  try {
    let ownerofaddress = (
      await connection.getAccountInfo(new PublicKey(address))
    ).owner;
    if (ownerofaddress == null) {
      ownerofaddress = (await connection.getAccountInfo(new PublicKey(address)))
        .owner;
      if (ownerofaddress == null) {
        ownerofaddress = (
          await connection.getAccountInfo(new PublicKey(address))
        ).owner;
        if (ownerofaddress == null) {
          ownerofaddress = (
            await connection.getAccountInfo(new PublicKey(address))
          ).owner;
        }
      }
    }
    if (ownerofaddress == "11111111111111111111111111111111") return false;
    else return true;
  } catch (e) {}
}

function calculateAmountIn(amountOut, reserveIn, reserveOut) {
  const numerator = new BigNumber(reserveIn).multupliedBy(amountOut).toFixed();
  const denominator = new BigNumber(reserveOut).minus(amountOut).toFixed();
  const amountIn = new BigNumber(numerator)
    .dividedBy(denominator)
    .plus(1)
    .toFixed();

  return amountIn;
}

function calculateAmountOut(inputAmount, inputReserve, outputReserve) {
  const k = new BigNumber(inputReserve).multipliedBy(outputReserve).toFixed();
  const newInputReserve = new BigNumber(inputReserve)
    .plus(inputAmount)
    .toFixed();
  const newOutputReserve = new BigNumber(k)
    .dividedBy(newInputReserve)
    .toFixed();
  const outputAmount = new BigNumber(outputReserve)
    .minus(newOutputReserve)
    .toFixed();

  return outputAmount;
}

function customToFixed(n) {
  if (Number(n) < 0.00001) {
    const str = new BigNumber(n).toFixed();
    let index = str.indexOf(".") + 1;
    while (str.charAt(index) === "0") {
      index++;
    }
    return str.substring(0, index + 4);
  } else if (Number(n) < 1) {
    const str = String(n);
    let index = str.indexOf(".") + 1;
    while (str.charAt(index) === "0") {
      index++;
    }
    return parseFloat(str.substring(0, index + 4));
  } else if (Number(n) < 100000) {
    return Number(new BigNumber(n).toFixed(2));
  } else return Number(new BigNumber(n).toFixed(0));
}

function getExplorerByChain(chain) {
  if (chain === "bnb") {
    return "bscscan.com";
  } else if (chain === "eth") {
    return "etherscan.io";
  } else if (chain === "sol") {
    return "solscan.io";
  }
}

function getEmojiByChain(chain) {
  if (chain === "bnb") {
    return "🟡";
  } else if (chain === "eth") {
    return "🔵";
  } else if (chain === "sol") {
    return "🟣";
  }
}

function unstringTg(text) {
  return new TextDecoder().decode(
    new TextEncoder().encode(String(text).replace(/\\/g, ""))
  );
}

function timeConverter(UNIX_timestamp) {
  const a = new Date(UNIX_timestamp * 1000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const year = a.getUTCFullYear();
  const month = months[a.getUTCMonth()];
  const date = a.getUTCDate();
  let hour = a.getUTCHours();
  let min = a.getUTCMinutes();
  if (String(hour).length === 1) {
    hour = "0" + String(hour);
  }
  if (String(min).length === 1) {
    min = "0" + String(min);
  }
  if (year !== new Date().getUTCFullYear()) {
    const time = date + " " + month + " " + year + " " + hour + ":" + min;
    return time;
  } else {
    const time = date + " " + month + " " + hour + ":" + min;
    return time;
  }
}

function getCoinNameByChain(chain) {
  if (chain === "bnb") {
    return "BNB";
  } else if (chain === "eth") {
    return "ETH";
  } else if (chain === "sol") {
    return "SOL";
  }
}

function getChartLink(website, chain, lpaddress) {
  if (website === "DexScreener") {
    if (chain === "eth") {
      return `https://dexscreener.com/ethereum/${lpaddress}`;
    } else if (chain === "bnb") {
      return `https://dexscreener.com/bsc/${lpaddress}`;
    } else if (chain === "base") {
      return `https://dexscreener.com/base/${lpaddress}`;
    } else if (chain === "sol") {
      return `https://dexscreener.com/solana/${lpaddress}`;
    }
  } else if (website === "DexTools") {
    if (chain === "eth") {
      return `https://www.dextools.io/app/en/ether/pair-explorer/${lpaddress}`;
    } else if (chain === "bnb") {
      return `https://www.dextools.io/app/en/bnb/pair-explorer/${lpaddress}`;
    } else if (chain === "base") {
      return `https://www.dextools.io/app/en/base/pair-explorer/${lpaddress}`;
    }
  } else if (website === "BirdEye") {
    if (chain === "sol") {
      return `https://birdeye.so/token/${lpaddress}`;
    }
  }
}

async function updateSolPrice() {
  try {
    const solinfo = await axios2.get(
      `https://api.dexscreener.com/latest/dex/pairs/solana/7qbrf6ysyguluvs6y1q64bdvrfe4zcuuz1jrdovnujnm`
    );
    await chainInfoSchema.findOneAndUpdate(
      { chain: "sol" },
      { coinPrice: solinfo.data.pair.priceUsd }
    );
  } catch {}
}

setInterval(() => {
  updateSolPrice();
}, 300000);

export {
  getRaydiumAmountIn,
  getRaydiumAmountOut,
  swapRaydiumExactIn,
  editSolanaTokenBuyMenu,
  getSolanaTokenInfo,
  calculateAmountIn,
  getAddressFromPrivatekey,
  calculateAmountOut,
  isAddressContract,
  getBalance,
  getEmojiByChain,
  editAllMenus,
  editTokenBuyMenu,
  getAmountIn,
  getExplorerByChain,
  getRouterAddressByChain,
  getCoinNameByChain,
  getWrappedCoinByChain,
  getAmountOut,
  getCoinBalances,
  getProviderByChain,
  getTokenFeeEth,
  verifyUserMonitors,
  getTokenBalances,
  getTokenFeeBnb,
  getValueAndDollarValue,
  getDividerByDecimals,
  getTokenInfo,
  getChartLink,
  getENS,
  stringTg,
  timeConverter,
  getGasPrice,
  getIsHoneypotEth,
  getTokenAnyVPrice,
  getChainByProvider,
  getIsHoneypotBnb,
  customToFixed,
  getPair,
  unstringTg,
};
