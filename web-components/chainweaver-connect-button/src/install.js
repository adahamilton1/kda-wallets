import { KdaWalletChainweaverConnectButton } from "./component";
import { DEFAULT_ELEM_TAG } from "./consts";

/**
 * window.customElements.define() the web component so that it can be used
 *
 * @param {string | null | undefined} [htmlTag] defaults to kda-wallet-chainweaver-connect-button if not provided
 */
export function defineCustomElement(htmlTag) {
  const name = htmlTag ?? DEFAULT_ELEM_TAG;
  window.customElements.define(name, KdaWalletChainweaverConnectButton);
}
