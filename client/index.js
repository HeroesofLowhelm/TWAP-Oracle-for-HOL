require('dotenv').config({path: __dirname + '/.env'})


const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {StatusType, MessageType} = require('@zilliqa-js/subscriptions');
const {
    toBech32Address,
    getAddressFromPrivateKey,
} = require('@zilliqa-js/crypto');

const {default: axios} = require("axios");
const websocket = "wss://dev-ws.zilliqa.com"
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

const chainId = 333; // chainId of the developer testnet
const msgVersion = 1; // current msgVersion
const VERSION = bytes.pack(chainId, msgVersion);

const MAX_RETRIES = process.env.MAX_RETRIES || 5
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 30
const privateKey = process.env.OWNER_WALLET_PRIVATEKEY;
zilliqa.wallet.addByPrivateKey(privateKey);
const address = getAddressFromPrivateKey(privateKey);
let minGasPrice = 0;
let balance = 0;
let myGasPrice = 0;
let isGasSufficient = false;

async function initializeNetwork() {
    // Get Balance
    balance = await zilliqa.blockchain.getBalance(address);
    // Get Minimum Gas Price from blockchain
    minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();

    console.log(`Your account balance is:`);
    console.log(balance.result);
    console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);

    myGasPrice = units.toQa('2000', units.Units.Li); // Gas Price that will be used by all transactions
    console.log(`My Gas Price ${myGasPrice.toString()}`);

    isGasSufficient = myGasPrice.gte(new BN(minGasPrice.result)); // Checks if your gas price is less than the minimum gas price
    console.log(`Is the gas price sufficient? ${isGasSufficient}`);
}



async function processRequest () {
    let retries = 0
    while (retries < MAX_RETRIES) {
        try {
            const holTWAP = await getTWAP();
            console.log("Received TWAP of HOL===========================>", holTWAP);
            await setTWAPPrice(holTWAP)
            return
        } catch (error) {
            if (retries === MAX_RETRIES - 1) {
                return
            }
            retries++
        }
    }
}

async function setTWAPPrice (holTWAP) {
    try {
        const twapOracleContract = zilliqa.contracts.at(process.env.TWAP_ORACLE_ADDRESS);
        const callTx = await twapOracleContract.callWithoutConfirm(
            'updateTWAPPrice',
            [
                {
                    vname: 'twapHol',
                    type: 'String',
                    value: holTWAP + '',
                }
            ],
            {
                // amount, gasPrice and gasLimit must be explicitly provided
                version: VERSION,
                amount: new BN(0),
                gasPrice: myGasPrice,
                gasLimit: Long.fromNumber(8000),
            },
            false,
        );
        const confirmedTxn = await callTx.confirm(callTx.id);
        if (confirmedTxn.receipt.success === true) {
            console.log("===============================Transaction Success===================================");
        }
    } catch (e) {
        console.log("Error while transaction===============>", e)
    }
}

async function getTWAP() {
    var config = {
        method: 'get',
        url: 'https://api.zilstream.com/rates/HOL?interval=1m&period=1h&currency=USD',
        headers: {}
    };

    try {
        let result = await axios(config);
        let prices = result.data;
        let sum = 0;
        for (let priceData of prices) {
            let price = priceData["close"];
            sum += price;
        }
        return sum / 61;
    } catch (e) {
        console.log("error occured from ZilStream===========>", e);
    }

}

(async () => {
    try {
        await initializeNetwork();
    } catch (e) {
        console.log("err while initializing====>", e);
    }

    setInterval(async () => {
        try {
            await processRequest();
        } catch (e) {
            console.log("err while processing Queue=====>", e);
        }
    }, SLEEP_INTERVAL * 60 * 1000)
})()
