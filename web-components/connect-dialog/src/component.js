import {
  WALLET_ABANDON_CONNECT_EVENT_NAME,
  WALLET_BEGIN_CONNECT_EVENT_NAME,
  WALLET_CONNECTED_EVENT_NAME,
  WALLET_ERROR_EVENT_NAME,
} from "@kcf/kda-wallet-web-components-base";
import { TEMPLATE } from "./template";

/**
 * @typedef ConnectWalletButton
 * @property {?import("@kcf/kda-wallet-base").KdaWallet} connectedWallet
 * @property {() => Promise<void>} disconnect
 */

/**
 * A ready-to-use "connect wallet" dialog containing "connect wallet" buttons for
 * each @kcf/kda-wallet-* wallet adapter.
 *
 * This class exposes the connected wallet through its `connectedWallet` property.
 */
export class KdaWalletConnectDialog extends HTMLElement {
  /** @returns {?import("@kcf/kda-wallet-base").KdaWallet} */
  get connectedWallet() {
    const btn = this.connectedConnectWalletButton;
    if (btn === null) {
      return null;
    }
    return btn.connectedWallet;
  }

  /** @returns {?ConnectWalletButton} */
  get connectedConnectWalletButton() {
    for (const connectWalletButtonUncasted of this.container.children) {
      /** @type {ConnectWalletButton} */
      // @ts-ignore
      const connectWalletButton = connectWalletButtonUncasted;
      if (connectWalletButton.connectedWallet) {
        return connectWalletButton;
      }
    }
    return null;
  }

  /** @returns {HTMLDialogElement} */
  get dialog() {
    // @ts-ignore
    return this.firstElementChild;
  }

  /** @returns {HTMLDivElement} */
  get container() {
    // @ts-ignore
    return this.querySelector("section");
  }

  /** @returns {HTMLDivElement} */
  get header() {
    // @ts-ignore
    return this.container.querySelector("header");
  }

  /** @returns {HTMLButtonElement} */
  get closeButton() {
    // @ts-ignore
    return this.header.querySelector("button");
  }

  /** @returns {boolean} */
  get open() {
    return this.dialog.open;
  }

  constructor() {
    super();

    // convert html string to document fragment
    const oldInnerHtml = this.innerHTML;
    const temporaryTemplate = document.createElement("template");
    temporaryTemplate.innerHTML = oldInnerHtml;

    this.innerHTML = TEMPLATE;
    this.container.appendChild(temporaryTemplate.content);

    // attach listeners in ctor, not connectedCallback
    // since we dont want to reattach them everytime this elem moves

    this.closeButton.onclick = this.close.bind(this);
    this.addEventListener(
      WALLET_BEGIN_CONNECT_EVENT_NAME,
      this.close.bind(this)
    );
    this.addEventListener(
      WALLET_ABANDON_CONNECT_EVENT_NAME,
      this.close.bind(this)
    );
    this.addEventListener(WALLET_CONNECTED_EVENT_NAME, this.close.bind(this));
    this.addEventListener(WALLET_ERROR_EVENT_NAME, this.close.bind(this));
  }

  /** @returns {Promise<void>} */
  disconnect() {
    const btn = this.connectedConnectWalletButton;
    if (btn === null) {
      return Promise.resolve();
    }
    return btn.disconnect();
  }

  showModal() {
    return this.dialog.showModal();
  }

  show() {
    return this.dialog.show();
  }

  close() {
    return this.dialog.close();
  }
}
