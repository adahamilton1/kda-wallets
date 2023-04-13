# @kcf/kda-wallet-connect-dialog

A ready-to-use "connect wallet" dialog containing "connect wallet" buttons for each `@kcf/kda-wallet-*` wallet adapter.

## Usage Notes

- As with all other `@kcf/kda-wallet-*` web components, the element is completely unstyled and not encapsulated in a shadow DOM to allow for easy customizability. The raw html is available in `template.js`
- Only `@kcf/kda-wallet-*-connect-button`s should be children of this element

## Example

```html
<kda-wallet-connect-dialog>
  <kda-wallet-chainweaver-connect-button
    autoresume
  ></kda-wallet-chainweaver-connect-button>
  <kda-wallet-eckowallet-connect-button
    autoresume
    network-id="testnet04"
  ></kda-wallet-eckowallet-connect-button>
  <kda-wallet-walletconnect-connect-button
    autoresume
    network-id="testnet04"
    wc-project-id="67ce47db9e4c2585385be3581ee3cb9d"
    wc-project-name="Example Kadena Wallet Adapter App"
    wc-project-description="A simple webapp for testing kadena wallets"
    wc-project-url="http://localhost"
    wc-project-icon="https://altcoinsbox.com/wp-content/uploads/2023/01/kadena-logo-300x300.webp"
  ></kda-wallet-walletconnect-connect-button>
  <kda-wallet-zelcore-connect-button
    autoresume
  ></kda-wallet-zelcore-connect-button>
</kda-wallet-connect-dialog>
```

```js
const dialog = document.querySelector("kda-wallet-connect-dialog");
const wallet = dialog.connectedWallet;
if (wallet) {
  console.log(wallet.accounts);
}
```
