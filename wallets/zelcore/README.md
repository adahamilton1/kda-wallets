# @kcf/kda-wallet-zelcore

Zelcore kadena wallet adapter

## Usage Notes

- `isInstalled()` assumes wallet is already open in the background
- Quicksign is not implemented

## Example

```js
import { PactCommand } from "@kadena/client";
import { ZelcoreWallet } from "@kcf/kda-wallet-zelcore";

const zelcoreWallet = await ZelcoreWallet.connect();

const { account, pubKey } = zelcoreWallet.accounts[0];
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

const signed = await zelcoreWallet.signCmd(transferCmd);

await fetch(
  "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send",
  {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(signed),
  }
);
```
