require('dotenv').config({path: __dirname + '/.env'})


const {BN, Long, bytes, units} = require('@zilliqa-js/util');
const {Zilliqa} = require('@zilliqa-js/zilliqa');
const {StatusType, MessageType} = require('@zilliqa-js/subscriptions');

const {default: axios} = require("axios");
const websocket = "wss://dev-ws.zilliqa.com"
const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');





// Listen for events from a contract - errors aren't caught
async function ListenForEvents(deployed_contract_base_16) {
    console.log(deployed_contract_base_16);
    const subscriber = zilliqa.subscriptionBuilder.buildEventLogSubscriptions(
        websocket,
        {
            addresses: [
                deployed_contract_base_16
            ],
        },
    );

    console.log("Listener started");

    subscriber.emitter.on(MessageType.EVENT_LOG, async (event) => {
        console.log("event emitted====>", JSON.stringify(event))
        if (event["value"]) {
            console.log("event has value========>", JSON.stringify(event["value"]));
            if (event["value"][0]["event_logs"] && event["value"][0]["event_logs"][0]) {
                let eventObj = event["value"][0]["event_logs"][0];
                console.log("event name==============>", eventObj["_eventname"]);
            }
        }
    });

    // subscriber.emitter.on(MessageType.NOTIFICATION, async (event) => {
    //     console.log('get new Notifications: ', JSON.stringify(event)); // this will emit 2/3 times before event emitted
    // });
    // subscriber.emitter.on(MessageType.NEW_BLOCK, async (event) => {
    //     console.log('New BLOCK=================>: ', JSON.stringify(event)); // this will emit 2/3 times before event emitted
    // });

    await subscriber.start();
}




(async () => {
    try {
        await  ListenForEvents(process.env.TWAP_ORACLE_ADDRESS);
    } catch (e) {
        console.log("err while listening events", e)
    }
})()
