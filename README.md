# TIME-WEIGHTED AVERAGE PRICE (TWAP) ORACLE TAILORED FOR HEROES OF LOWHELM
### Summery
Determines average price of $HOL in USD in the last 1 hour between exchanges (XCAD DEX + ZILSWAP DEX).
Calls TWAP every 30minute and stores data into the contract for which the video game's back end can fetch data from HOL's TWAP Contract.

## Oracle Part
- Oracle Client fetches every 1 minutes' $HOL price values for last 1 hour, and then calculate $HOL TWAP and then invokes Oracle Smart Contract's transition named "updateTWAPPrice(twapHol: String)".
Oracle Client causes this action every 30 minutes.
- Oracle Smart Contract checks if the caller is the owner of the contract or not first. Since the Oracle client uses the owner wallet's private key, it accepts the value (latest $HOL TWAP) and then saves it to the mutable field named "hol_twap".
And then it emits specific event called "UpdatedTWAPPrice". This is very useful for Game back-end to get notified whether the price is updated or not.

## Game Back-end requirement
### This is the minimum requirement for our Game Back-end
Game Back-end always listen to the Oracle contract's specific event above. Once the event is emitted, it fetches Oracle Contract's state called "hol_twap".