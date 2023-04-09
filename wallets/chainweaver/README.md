# @kcf/kda-wallet-chainweaver

Chainweaver kadena wallet adapter

## Usage Notes

- `isInstalled()` assumes wallet is already open in the background
- Since chainweaver doesn't provide a way to get the wallet's accounts, you must provide the `AccountsList` manually. This is typically done using an interactive dialog requesting users to paste their account/pubkey into.

## Example

```html
<!-- provide a way to collect the user's account on your site -->
<dialog id="connect-chainweaver-dialog">
  <form id="connect-chainweaver-form">
    <label>
      <p>Paste your 'k:' wallet address here:</p>
      <input id="chainweaver-address-input" type="text" />
    </label>
    <button type="submit">Connect</button>
  </form>
  <p>Press esc to close</p>
</dialog>
```

```js
import { PactCommand } from "@kadena/client";
import { isKAccount, kAccountPubkey } from "@kcf/kda-wallet-base";
import { ChainweaverWallet } from "@kcf/kda-wallet-chainweaver";

/**
 * @returns {Promise<ChainweaverWallet>}
 */
async function connectChainweaverViaDialog() {
  const dialog = document.getElementById("connect-chainweaver-dialog");
  dialog.showModal();
  const form = document.getElementById("connect-chainweaver-form");
  const kInput = document.getElementById("chainweaver-address-input");
  return new Promise((resolve, reject) => {
    dialog.onclose = () => reject(new Error("dialog closed"));

    form.onsubmit = (event) => {
      event.preventDefault();
      const account = kInput.value;
      if (!isKAccount(account)) {
        alert("only k: accounts supported");
        dialog.close();
        return;
      }
      dialog.onclose = null;
      dialog.close();
      resolve(
        ChainweaverWallet.connect({
          accounts: [{ account, pubKey: kAccountPubkey(account) }],
        })
      );
    };
  });
}

const chainweaverWallet = await connectChainweaverViaDialog();

const { account, pubKey } = chainweaverWallet.accounts[0];
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

const signed = await chainweaverWallet.signCmd(transferCmd);

await fetch(
  "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send",
  {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(signed),
  }
);
```
