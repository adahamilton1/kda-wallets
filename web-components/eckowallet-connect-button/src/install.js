import { KdaWalletEckowalletConnectButton } from "./component";
import { DEFAULT_ELEM_TAG } from "./consts";

/**
 * window.customElements.define() the web component so that it can be used
 *
 * @param {string | null | undefined} [htmlTag] defaults to kda-wallets-connect-dialog if not provided
 */
export function defineCustomElement(htmlTag) {
  const name = htmlTag ?? DEFAULT_ELEM_TAG;
  window.customElements.define(name, KdaWalletEckowalletConnectButton);
}
