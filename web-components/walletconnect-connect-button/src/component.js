import { Web3Modal } from "@web3modal/standalone";
import { isChainwebNetworkId } from "@kcf/kda-wallet-base";
import { mkChainKey, WalletConnectWallet } from "@kcf/kda-wallet-walletconnect";
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
import {
  NETWORK_ID_ATTR_NAME,
  WC_PROJECT_DESCRIPTION_ATTR_NAME,
  WC_PROJECT_ICON_ATTR_NAME,
  WC_PROJECT_ID_ATTR_NAME,
  WC_PROJECT_NAME_ATTR_NAME,
  WC_PROJECT_URL_ATTR_NAME,
  WC_RELAY_URL_ATTR_NAME,
} from "./consts";
import { TEMPLATE } from "./template";

/**
 * @typedef WalletConnectAutoResumeData
 * @property {string} pairingTopic
 */

/**
 * A ready-to-use chainweaver connect wallet button.
 *
 * Connects to the k: account manually entered by the user in an opened dialog.
 *
 * This element exposes the connected wallet through its `connectedWallet` property
 */
export class KdaWalletWalletconnectConnectButton extends HTMLElement {
  /** @type {?WalletConnectWallet} */
  #connectedWallet;

  static get observedAttributes() {
    return [
      AUTORESUME_ATTR_NAME,
      AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME,
      NETWORK_ID_ATTR_NAME,
      WC_PROJECT_DESCRIPTION_ATTR_NAME,
      WC_PROJECT_ICON_ATTR_NAME,
      WC_PROJECT_ID_ATTR_NAME,
      WC_PROJECT_NAME_ATTR_NAME,
      WC_PROJECT_URL_ATTR_NAME,
      WC_RELAY_URL_ATTR_NAME,
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

  /**
   * defaults to empty string if not provided
   * @returns {string}
   */
  get wcProjectDescription() {
    return this.getAttribute(WC_PROJECT_DESCRIPTION_ATTR_NAME) ?? "";
  }

  /**
   * defaults to empty string if not provided
   * @returns {string}
   */
  get wcProjectIcon() {
    return this.getAttribute(WC_PROJECT_ICON_ATTR_NAME) ?? "";
  }

  /**
   * defaults to empty string if not provided
   * @returns {string}
   */
  get wcProjectId() {
    return this.getAttribute(WC_PROJECT_ID_ATTR_NAME) ?? "";
  }

  /**
   * defaults to empty string if not provided
   * @returns {string}
   */
  get wcProjectName() {
    return this.getAttribute(WC_PROJECT_NAME_ATTR_NAME) ?? "";
  }

  /**
   * defaults to empty string if not provided
   * @returns {string}
   */
  get wcProjectUrl() {
    return this.getAttribute(WC_PROJECT_URL_ATTR_NAME) ?? "";
  }

  /**
   * defaults to undefined if not provided
   * @returns {string | undefined}
   */
  get wcRelayUrl() {
    return this.getAttribute(WC_RELAY_URL_ATTR_NAME) ?? undefined;
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

  /**
   * @returns {Web3Modal}
   */
  mkWeb3Modal() {
    const res = new Web3Modal({
      projectId: this.wcProjectId,
      walletConnectVersion: 2,
      standaloneChains: [mkChainKey(this.networkId)],
    });
    // make abandon event send at most once
    let hasSentEvent = false;
    res.subscribeModal((newState) => {
      if (hasSentEvent || newState.open) {
        return;
      }
      hasSentEvent = true;
      // hax to check this.connectedWallet only on the next iter of the event loop so that
      // closeModal in successful WalletConnectWallet.connect()
      // doesnt send an abandon event
      setTimeout(() => {
        if (this.connectedWallet === null) {
          const abandonConnectEvent =
            mkWalletAbandonConnectEvent(WalletConnectWallet);
          this.dispatchEvent(abandonConnectEvent);
        }
      });
    });
    return res;
  }

  /**
   * @returns {import("@walletconnect/types").SignClientTypes.Options}
   */
  mkWcSignClientOptions() {
    return {
      projectId: this.wcProjectId,
      relayUrl: this.wcRelayUrl,
      metadata: {
        name: this.wcProjectName,
        description: this.wcProjectDescription,
        url: this.wcProjectUrl,
        icons: [this.wcProjectIcon],
      },
    };
  }

  /** @returns {Promise<boolean>} if wallet is installed */
  async checkInstalled() {
    const isInstalled = await WalletConnectWallet.isInstalled();
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
    deleteAutoResumeData(WalletConnectWallet, this.autoresumekey);
    const disconnectedEvent = mkWalletDisconnectedEvent(this.connectedWallet);
    this.#connectedWallet = null;
    this.dispatchEvent(disconnectedEvent);
  }

  /** @param {string} [pairingTopic] */
  async connect(pairingTopic) {
    try {
      const beginConnectEvent = mkWalletBeginConnectEvent(WalletConnectWallet);
      this.dispatchEvent(beginConnectEvent);
      const wallet = await WalletConnectWallet.connect({
        signClientOptions: this.mkWcSignClientOptions(),
        networkId: this.networkId,
        walletConnectModalController: this.mkWeb3Modal(),
        pairingTopic,
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
    const loaded = loadAutoResumeData(WalletConnectWallet, this.autoresumekey);
    if (loaded === null) {
      return;
    }
    /** @type {import("@kcf/kda-wallet-web-components-base").AutoResumeData<WalletConnectAutoResumeData>} */
    const {
      data: { pairingTopic },
    } = loaded;
    await this.connect(pairingTopic);
  }

  /**
   * Updates local storage auto resume data
   * @param {string} [oldAutoResumeKeyToDelete]
   */
  updateAutoResumeData(oldAutoResumeKeyToDelete) {
    if (oldAutoResumeKeyToDelete !== undefined) {
      deleteAutoResumeData(WalletConnectWallet, oldAutoResumeKeyToDelete);
    }
    if (!this.autoresume) {
      deleteAutoResumeData(WalletConnectWallet, this.autoresumekey);
      return;
    }
    if (!this.#connectedWallet) {
      return;
    }
    /** @type {WalletConnectAutoResumeData} */
    const data = {
      pairingTopic: this.#connectedWallet.pairingTopic,
    };
    saveAutoResumeData(WalletConnectWallet, data, this.autoresumekey);
  }
}
