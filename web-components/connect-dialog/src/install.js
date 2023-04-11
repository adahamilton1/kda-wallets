import { KdaWalletConnectDialog } from "./component";

/**
 * window.customElements.define() the web component so that it can be used
 *
 * @param {string | null | undefined} [htmlTag] defaults to kda-wallets-connect-dialog if not provided
 */
export function defineCustomElement(htmlTag) {
  const name = htmlTag ?? "kda-wallet-connect-dialog";
  window.customElements.define(name, KdaWalletConnectDialog);
}
