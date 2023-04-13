# @kcf/kda-wallet-chainweaver-connect-button

A ready-to-use Chainweaver connect wallet button.

## Usage Notes

- As with all other `@kcf/kda-wallet-*` web components, the element is completely unstyled and not encapsulated in a shadow DOM to allow for easy customizability. The raw html is available in `template.js`
- This component also creates a `<dialog>` for users to enter their `k:` accounts into and appends it to `document.body`

## Attributes

| name          | description                                                                                                                                                 | required | default                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| autoresume    | when set, the component will save the current wallet connected session to localStorage and attempt to resume from it the next time the user enters the site | no       | false                                                                      |
| autoresumekey | the localStorage key to use to save autoresume data                                                                                                         | no       | `@kcf/kda-wallets-web-components-base.DEFAULT_AUTORESUME_LOCALSTORAGE_KEY` |

## Custom Events

See `@kcf/kda-wallet-web-components-base` for custom events' detail schema

| name                     | dispatched after                                      |
| ------------------------ | ----------------------------------------------------- |
| kdawallet:beginconnect   | user clicks the button                                |
| kdawallet:abandonconnect | user closes the chainweaver dialog without connecting |
| kdawallet:connected      | wallet connected                                      |
| kdawallet:disconnected   | wallet disconnected                                   |
| kdawallet:error          | error                                                 |

## Example

```html
<kda-wallet-chainweaver-connect-button
  autoresume
></kda-wallet-chainweaver-connect-button>
```

```js
const btn = document.querySelector("kda-wallet-chainweaver-connect-button");
const wallet = btn.connectedWallet;
if (wallet) {
  console.log(wallet.accounts);
}
```
