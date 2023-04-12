import { isKAccount, kAccountPubkey } from "@kcf/kda-wallet-base";
import { ChainweaverWallet } from "@kcf/kda-wallet-chainweaver";
import {
  mkWalletAbandonConnectEvent,
  mkWalletBeginConnectEvent,
  mkWalletConnectedEvent,
  mkWalletDisconnectedEvent,
  mkWalletErrorEvent,
} from "@kcf/kda-wallet-web-components-base";
import { TEMPLATE } from "./template";

/**
 * A ready-to-use "connect wallet" dialog containing "connect wallet" buttons for
 * each @kcf/kda-wallet-* wallet adapter.
 *
 * This class exposes the connected wallet through its `connectedWallet` property
 */
export class KdaWalletChainweaverConnectButton extends HTMLElement {
  /** @type {?ChainweaverWallet} */
  #connectedWallet;

  get connectedWallet() {
    return this.#connectedWallet;
  }

  /** @returns {HTMLButtonElement} */
  get button() {
    // @ts-ignore
    return this.firstElementChild;
  }

  /** @returns {HTMLDialogElement} */
  get dialog() {
    // @ts-ignore
    return this.querySelector("dialog");
  }

  /** @returns {HTMLDivElement} */
  get dialogContainer() {
    // @ts-ignore
    return this.dialog.querySelector("section");
  }

  /** @returns {HTMLDivElement} */
  get dialogHeader() {
    // @ts-ignore
    return this.dialogContainer.querySelector("header");
  }

  /** @returns {HTMLButtonElement} */
  get dialogCloseButton() {
    // @ts-ignore
    return this.dialogHeader.querySelector("button");
  }

  /** @returns {HTMLFormElement} */
  get form() {
    // @ts-ignore
    return this.dialogContainer.querySelector("form");
  }

  /** @returns {HTMLInputElement} */
  get addressInput() {
    // @ts-ignore
    return this.form.querySelector("input");
  }

  constructor() {
    super();
    this.#connectedWallet = null;
    this.innerHTML = TEMPLATE;

    // attach listeners in ctor, not connectedCallback
    // since we dont want to reattach them everytime this elem moves
    this.button.onclick = () => {
      this.dialog.showModal();
      const beginConnectEvent = mkWalletBeginConnectEvent(ChainweaverWallet);
      this.dispatchEvent(beginConnectEvent);
    };
    this.dialogCloseButton.onclick = () => {
      this.dialog.close();
      const abandonConnectEvent =
        mkWalletAbandonConnectEvent(ChainweaverWallet);
      this.dispatchEvent(abandonConnectEvent);
    };
    this.addressInput.onchange = () => this.addressInput.setCustomValidity("");
    this.form.onsubmit = this.onFormSubmit.bind(this);
    this.checkInstalled();
  }

  async checkInstalled() {
    const isInstalled = await ChainweaverWallet.isInstalled();
    if (isInstalled) {
      while (this.button.hasAttribute("disabled")) {
        this.button.removeAttribute("disabled");
      }
    } else if (!this.button.hasAttribute("disabled")) {
      this.button.setAttribute("disabled", "1");
    }
  }

  /**
   *
   * @param {SubmitEvent} event
   */
  async onFormSubmit(event) {
    event.preventDefault();
    try {
      const accountRaw = new FormData(this.form).get("address");
      if (accountRaw === null) {
        this.addressInput.setCustomValidity("No address entered");
        return;
      }
      const account = accountRaw.toString();
      if (!isKAccount(account)) {
        this.addressInput.setCustomValidity(
          "Sorry, only k: accounts are supported"
        );
        return;
      }
      const wallet = await ChainweaverWallet.connect({
        accounts: [{ account, pubKey: kAccountPubkey(account) }],
      });
      if (this.dialog.open) {
        this.dialog.close();
      }
      this.#connectedWallet = wallet;
      const connectedEvent = mkWalletConnectedEvent(wallet);
      this.dispatchEvent(connectedEvent);
    } catch (err) {
      const errEvent = mkWalletErrorEvent(err);
      this.dispatchEvent(errEvent);
      throw err;
    }
  }

  async disconnect() {
    if (!this.connectedWallet) {
      return;
    }
    await this.connectedWallet.disconnect();
    const disconnectedEvent = mkWalletDisconnectedEvent(this.connectedWallet);
    this.#connectedWallet = null;
    this.dispatchEvent(disconnectedEvent);
  }
}
