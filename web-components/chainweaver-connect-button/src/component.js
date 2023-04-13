import { isKAccount, kAccountPubkey } from "@kcf/kda-wallet-base";
import { ChainweaverWallet } from "@kcf/kda-wallet-chainweaver";
import {
  AUTORESUME_ATTR_NAME,
  AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME,
  deleteAutoResumeData,
  loadAutoResumeData,
  mkWalletAbandonConnectEvent,
  mkWalletBeginConnectEvent,
  mkWalletConnectedEvent,
  mkWalletDisconnectedEvent,
  mkWalletErrorEvent,
  saveAutoResumeData,
} from "@kcf/kda-wallet-web-components-base";
import { DIALOG_INNER_HTML, TEMPLATE } from "./template";

/**
 * @typedef ChainweaverAutoResumeData
 * @property {import("@kcf/kda-wallet-base").AccountsList} accounts
 */

/**
 * A ready-to-use chainweaver connect wallet button.
 *
 * Connects to the k: account manually entered by the user in an opened dialog.
 *
 * This element exposes the connected wallet through its `connectedWallet` property
 */
export class KdaWalletChainweaverConnectButton extends HTMLElement {
  /** @type {?ChainweaverWallet} */
  #connectedWallet;

  /** @type {HTMLDialogElement} */
  #dialog;

  static get observedAttributes() {
    return [AUTORESUME_ATTR_NAME, AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME];
  }

  attributeChangedCallback(name, oldValue) {
    switch (name) {
      case AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME:
        this.updateAutoResumeData(oldValue);
        break;
      case AUTORESUME_ATTR_NAME:
        this.updateAutoResumeData();
        break;
      default:
        break;
    }
  }

  /** @return {boolean} */
  get autoresume() {
    return this.hasAttribute(AUTORESUME_ATTR_NAME);
  }

  get autoresumekey() {
    return (
      this.getAttribute(AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME) ?? undefined
    );
  }

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
    return this.#dialog;
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

    const dialog = document.createElement("dialog");
    dialog.innerHTML = DIALOG_INNER_HTML;
    document.body.append(dialog);
    this.#dialog = dialog;

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
    this.checkInstalled().then((isInstalled) => {
      if (isInstalled && this.autoresume) {
        this.tryAutoResume();
      }
    });
  }

  /** @returns {Promise<boolean>} if wallet is installed */
  async checkInstalled() {
    const isInstalled = await ChainweaverWallet.isInstalled();
    if (isInstalled) {
      while (this.button.hasAttribute("disabled")) {
        this.button.removeAttribute("disabled");
      }
    } else if (!this.button.hasAttribute("disabled")) {
      this.button.setAttribute("disabled", "1");
    }
    return isInstalled;
  }

  async disconnect() {
    if (!this.connectedWallet) {
      return;
    }
    await this.connectedWallet.disconnect();
    deleteAutoResumeData(ChainweaverWallet, this.autoresumekey);
    const disconnectedEvent = mkWalletDisconnectedEvent(this.connectedWallet);
    this.#connectedWallet = null;
    this.dispatchEvent(disconnectedEvent);
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
      await this.connect([{ account, pubKey: kAccountPubkey(account) }]);
    } catch (err) {
      const errEvent = mkWalletErrorEvent(err);
      this.dispatchEvent(errEvent);
      throw err;
    }
  }

  /** @param {import("@kcf/kda-wallet-base").AccountsList} accounts */
  async connect(accounts) {
    const wallet = await ChainweaverWallet.connect({
      accounts,
    });
    if (this.dialog.open) {
      this.dialog.close();
    }
    this.#connectedWallet = wallet;
    const connectedEvent = mkWalletConnectedEvent(wallet);
    this.dispatchEvent(connectedEvent);
    this.updateAutoResumeData();
  }

  async tryAutoResume() {
    const loaded = loadAutoResumeData(ChainweaverWallet, this.autoresumekey);
    if (loaded === null) {
      return;
    }
    /** @type {import("@kcf/kda-wallet-web-components-base").AutoResumeData<ChainweaverAutoResumeData>} */
    const {
      data: { accounts },
    } = loaded;
    try {
      const beginConnectEvent = mkWalletBeginConnectEvent(ChainweaverWallet);
      this.dispatchEvent(beginConnectEvent);
      await this.connect(accounts);
    } catch (err) {
      const errEvent = mkWalletErrorEvent(err);
      this.dispatchEvent(errEvent);
      throw err;
    }
  }

  /**
   * Updates local storage auto resume data
   * @param {string} [oldAutoResumeKeyToDelete]
   */
  updateAutoResumeData(oldAutoResumeKeyToDelete) {
    if (oldAutoResumeKeyToDelete !== undefined) {
      deleteAutoResumeData(ChainweaverWallet, oldAutoResumeKeyToDelete);
    }
    if (!this.autoresume) {
      deleteAutoResumeData(ChainweaverWallet, this.autoresumekey);
      return;
    }
    if (!this.#connectedWallet) {
      return;
    }
    /** @type {ChainweaverAutoResumeData} */
    const data = {
      accounts: this.#connectedWallet.accounts,
    };
    saveAutoResumeData(ChainweaverWallet, data, this.autoresumekey);
  }
}
