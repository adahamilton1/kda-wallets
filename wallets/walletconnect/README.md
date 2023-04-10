# @kcf/kda-wallet-walletconnect

WalletConnect kadena wallet adapter

## Usage Notes

- Requires passing in `signClientOptions`, `networkId` and `walletConnectModalController` to `connect()`
  - `signClientOptions`: WalletConnect SignClient configuration options such as relayURL and dapp metadata
  - `walletConnectModalController`: an object that controls the opening and closing of a WalletConnect QR code modal for users to scan. [@web3modal/standalone](https://github.com/WalletConnect/web3modal/tree/V2/packages/standalone)'s `Web3Modal` class can be used here.
- A previously saved `pairingTopic` can be passed to `connect()` to resume an existing connection
- None of the WalletConnect wallets implement quicksign yet

## Example

```js
import { PactCommand } from "@kadena/client";
/**
 * https://github.com/mapbox/mapbox-gl-geocoder/issues/441
 * `events` npm package must be installed
 * else Web3Modal will throw
 * `events_1.EventEmitter is not a constructor`
 *
 */
import { Web3Modal } from "@web3modal/standalone";
import { mkChainKey, WalletConnectWallet } from "@kcf/kda-wallet-walletconnect";

const PAIRING_TOPIC_LOCAL_STORAGE_KEY = "walletConnectPairingTopic";

const WALLETCONNECT_PROJECT_ID = "67ce47db9e4c2585385be3581ee3cb9d";

const WALLETCONNECT_SIGN_CLIENT_OPTIONS = {
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: "Example Kadena Wallet Adapter App",
    description: "A simple webapp for testing kadena wallets",
    url: "http://localhost",
    icons: [
      "https://altcoinsbox.com/wp-content/uploads/2023/01/kadena-logo-300x300.webp",
    ],
  },
};

const WEB3_MODAL = new Web3Modal({
  projectId: WALLETCONNECT_PROJECT_ID,
  walletConnectVersion: 2,
  standaloneChains: [mkChainKey("mainnet01")],
});

const walletConnectWallet = await WalletConnectWallet.connect({
  signClientOptions: WALLETCONNECT_SIGN_CLIENT_OPTIONS,
  walletConnectModalController: WEB3_MODAL,
  networkId: "mainnet01",
  pairingTopic:
    window.localStorage.getItem(PAIRING_TOPIC_LOCAL_STORAGE_KEY) ?? undefined,
});

// save pairingTopic to resume session later
window.localStorage.setItem(
  PAIRING_TOPIC_LOCAL_STORAGE_KEY,
  walletConnectWallet.pairingTopic
);

const { account, pubKey } = walletConnectWallet.accounts[0];
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

const signed = await walletConnectWallet.signCmd(transferCmd);

await fetch(
  "https://api.chainweb.com/chainweb/0.0/mainnet01/chain/0/pact/api/v1/send",
  {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify(signed),
  }
);
```
