# @kcf/kda-wallet-eckowallet-connect-button

A ready-to-use eckoWALLET connect wallet button.

## Usage Notes

- As with all other `@kcf/kda-wallet-*` web components, the element is completely unstyled and not encapsulated in a shadow DOM to allow for easy customizability. The raw html is available in `template.js`

## Attributes

| name          | description                                                                                                                                                 | required | default                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| autoresume    | when set, the component will save the current wallet connected session to localStorage and attempt to resume from it the next time the user enters the site | no       | false                                                                      |
| autoresumekey | the localStorage key to use to save autoresume data                                                                                                         | no       | `@kcf/kda-wallets-web-components-base.DEFAULT_AUTORESUME_LOCALSTORAGE_KEY` |
| network-id    | the chainweb network ID                                                                                                                                     | no       | "mainnet01"                                                                |

## Custom Events

See `@kcf/kda-wallet-web-components-base` for custom events' detail schema

| name                   | dispatched after       |
| ---------------------- | ---------------------- |
| kdawallet:beginconnect | user clicks the button |
| kdawallet:connected    | wallet connected       |
| kdawallet:disconnected | wallet disconnected    |
| kdawallet:error        | error                  |

## Example

```html
<kda-wallet-eckowallet-connect-button
  autoresume
></kda-wallet-eckowallet-connect-button>
```

```js
import { defineCustomElement } from "@kcf/kda-wallet-eckowallet-connect-button";

// must be called before use
defineCustomElement();

const btn = document.querySelector("kda-wallet-eckowallet-connect-button");
const wallet = btn.connectedWallet;
if (wallet) {
  console.log(wallet.accounts);
}
```
