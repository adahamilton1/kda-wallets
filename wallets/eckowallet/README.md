# @kcf/kda-wallet-eckowallet

eckoWALLET browser extension kadena wallet adapter

## Usage Notes

- Requires passing in `networkId` to `connect()`, and for user's networkId setting in the browser extension to match the passed-in `networkId`
- Quicksign seems to be broken in the latest update

## Example

```js
import { PactCommand } from "@kadena/client";
import { EckoWallet } from "@kcf/kda-wallet-eckowallet";

const eckoWallet = await EckoWallet.connect({ networkId: "mainnet01" });

const { account, pubKey } = eckoWallet.accounts[0];
const toAccount = "to-account";
const amount = 0.1;

const transferCmd = new PactCommand();
transferCmd.code = `(coin.transfer "${account}" "${toAccount}" ${amount})`;
transferCmd.setMeta(
  {
    sender: account,
    chainId: "0",
    ttl: 600,
    gasLimit: 1000,
    gasPrice: 1e-6,
  },
  "mainnet01"
);
transferCmd.addCap("coin.GAS", pubKey);
transferCmd.addCap("coin.TRANSFER", pubKey, account, toAccount, amount);

const signed = await eckoWallet.signCmd(transferCmd);

await fetch(
  "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send",
  {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(signed),
  }
);
```
