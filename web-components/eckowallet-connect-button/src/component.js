import { isChainwebNetworkId } from "@kcf/kda-wallet-base";
import { EckoWallet } from "@kcf/kda-wallet-eckowallet";
import {
  AUTORESUME_ATTR_NAME,
  AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME,
  deleteAutoResumeData,
  loadAutoResumeData,
  mkWalletBeginConnectEvent,
  mkWalletConnectedEvent,
  mkWalletDisconnectedEvent,
  mkWalletErrorEvent,
  saveAutoResumeData,
} from "@kcf/kda-wallet-web-components-base";
import { NETWORK_ID_ATTR_NAME } from "./consts";
import { TEMPLATE } from "./template";

/**
 * A ready-to-use eckoWALLET connect wallet button.
 *
 * This element exposes the connected wallet through its `connectedWallet` property
 */
export class KdaWalletEckowalletConnectButton extends HTMLElement {
  /** @type {?EckoWallet} */
  #connectedWallet;

  static get observedAttributes() {
    return [
      AUTORESUME_ATTR_NAME,
      AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME,
      NETWORK_ID_ATTR_NAME,
    ];
  }

  attributeChangedCallback(name, oldValue) {
    switch (name) {
      case AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME:
        this.updateAutoResumeData(oldValue);
        break;
      case AUTORESUME_ATTR_NAME:
        this.updateAutoResumeData();
        break;
      case NETWORK_ID_ATTR_NAME:
        this.disconnect();
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

  /**
   * defaults to `mainnet01` if not provided or malformed
   * @returns {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId}
   */
  get networkId() {
    const raw = this.getAttribute(NETWORK_ID_ATTR_NAME);
    if (raw === null || !isChainwebNetworkId(raw)) {
      return "mainnet01";
    }
    return raw;
  }

  get connectedWallet() {
    return this.#connectedWallet;
  }

  /** @returns {HTMLButtonElement} */
  get button() {
    // @ts-ignore
    return this.firstElementChild;
  }

  constructor() {
    super();
    this.#connectedWallet = null;
    this.innerHTML = TEMPLATE;

    // attach listeners in ctor, not connectedCallback
    // since we dont want to reattach them everytime this elem moves
    this.button.onclick = () => this.connect();
    this.checkInstalled().then((isInstalled) => {
      if (isInstalled && this.autoresume) {
        this.tryAutoResume();
      }
    });
  }

  /** @returns {Promise<boolean>} if wallet is installed */
  async checkInstalled() {
    const isInstalled = await EckoWallet.isInstalled();
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
    deleteAutoResumeData(EckoWallet, this.autoresumekey);
    const disconnectedEvent = mkWalletDisconnectedEvent(this.connectedWallet);
    this.#connectedWallet = null;
    this.dispatchEvent(disconnectedEvent);
  }

  async connect() {
    try {
      const beginConnectEvent = mkWalletBeginConnectEvent(EckoWallet);
      this.dispatchEvent(beginConnectEvent);
      // TODO: resolve semantic inconsistency where
      // a user rejecting request fires wallet error event
      // instead of wallet connet abandon event like chainweaver and walletconnect
      const wallet = await EckoWallet.connect({
        networkId: this.networkId,
      });
      this.#connectedWallet = wallet;
      const connectedEvent = mkWalletConnectedEvent(wallet);
      this.dispatchEvent(connectedEvent);
      this.updateAutoResumeData();
    } catch (err) {
      const errEvent = mkWalletErrorEvent(err);
      this.dispatchEvent(errEvent);
      throw err;
    }
  }

  async tryAutoResume() {
    const loaded = loadAutoResumeData(EckoWallet, this.autoresumekey);
    if (loaded === null) {
      return;
    }
    await this.connect();
  }

  /**
   * Updates local storage auto resume data
   * @param {string} [oldAutoResumeKeyToDelete]
   */
  updateAutoResumeData(oldAutoResumeKeyToDelete) {
    if (oldAutoResumeKeyToDelete !== undefined) {
      deleteAutoResumeData(EckoWallet, oldAutoResumeKeyToDelete);
    }
    if (!this.autoresume) {
      deleteAutoResumeData(EckoWallet, this.autoresumekey);
      return;
    }
    if (!this.#connectedWallet) {
      return;
    }
    saveAutoResumeData(EckoWallet, undefined, this.autoresumekey);
  }
}
