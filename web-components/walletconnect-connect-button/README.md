# @kcf/kda-wallet-walletconnect-connect-button

A ready-to-use WalletConnect connect wallet button.

## Usage Notes

- As with all other `@kcf/kda-wallet-*` web components, the element is completely unstyled and not encapsulated in a shadow DOM to allow for easy customizability. The raw html is available in `template.js`
- Uses [@web3modal/standalone](https://github.com/WalletConnect/web3modal/tree/V2/packages/standalone) to present the WalletConect QR code

## Attributes

| name                   | description                                                                                                                                                 | required | default                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| autoresume             | when set, the component will save the current wallet connected session to localStorage and attempt to resume from it the next time the user enters the site | no       | false                                                                      |
| autoresumekey          | the localStorage key to use to save autoresume data                                                                                                         | no       | `@kcf/kda-wallets-web-components-base.DEFAULT_AUTORESUME_LOCALSTORAGE_KEY` |
| network-id             | the chainweb network ID                                                                                                                                     | no       | "mainnet01"                                                                |
| wc-relay-url           | WalletConnect Relay URL                                                                                                                                     | no       | "relay.walletconnect.com"                                                  |
| wc-project-id          | WalletConnect project ID                                                                                                                                    | yes      | -                                                                          |
| wc-project-name        | WalletConnect project name                                                                                                                                  | yes      | -                                                                          |
| wc-project-description | WalletConnect project description                                                                                                                           | yes      | -                                                                          |
| wc-project-url         | WalletConnect project URL                                                                                                                                   | yes      | -                                                                          |
| wc-project-icon        | WalletConnect project icon image URL                                                                                                                        | yes      | -                                                                          |

## Custom Events

See `@kcf/kda-wallet-web-components-base` for custom events' detail schema

| name                     | dispatched after                             |
| ------------------------ | -------------------------------------------- |
| kdawallet:beginconnect   | user clicks the button                       |
| kdawallet:abandonconnect | user closes the web3modal without connecting |
| kdawallet:connected      | wallet connected                             |
| kdawallet:disconnected   | wallet disconnected                          |
| kdawallet:error          | error                                        |

## Example

```html
<kda-wallet-walletconnect-connect-button
  autoresume
  network-id="testnet04"
  wc-project-id="67ce47db9e4c2585385be3581ee3cb9d"
  wc-project-name="Example Kadena Wallet Adapter App"
  wc-project-description="A simple webapp for testing kadena wallets"
  wc-project-url="http://localhost"
  wc-project-icon="https://altcoinsbox.com/wp-content/uploads/2023/01/kadena-logo-300x300.webp"
></kda-wallet-walletconnect-connect-button>
```

```js
const btn = document.querySelector("kda-wallet-walletconnect-connect-button");
const wallet = btn.connectedWallet;
if (wallet) {
  console.log(wallet.accounts);
}
```
