import { KdaWallet, toSigningRequest } from "@kcf/kda-wallet-base";
import SignClient from "@walletconnect/sign-client";
import {
  KADENA_SIGN_METHOD_STR,
  WALLETCONNECT_USER_INITIATED_ERRCODE,
} from "./consts";
import {
  mkChainKey,
  mkRequiredNamespaces,
  parseKAccount,
  signClientLastPairing,
  signClientLastSession,
} from "./utils";

/**
 * TODO: import this type from base package instead (BREAKING)
 * @typedef {Exclude<import("@kadena/types").ChainwebNetworkId, undefined>} NonNullChainwebNetworkId
 */

/**
 * @typedef OpenModalArgs
 * @property {string} uri
 */

/**
 * @typedef WalletConnectModalController
 * @property {(args: OpenModalArgs) => any} openModal open the WalletConnet QR code modal
 * @property {() => any} closeModal
 */

/**
 * @typedef WalletConnectCtorArgs
 * @property {import("@kcf/kda-wallet-base").AccountsList} accounts
 * @property {SignClient} signClient
 * @property {NonNullChainwebNetworkId} networkId
 */

/**
 * @typedef WalletConnectConnectArgs
 * @property {import("@walletconnect/types").SignClientTypes.Options} signClientOptions configure WalletConnect options such as relayURL and dapp metadata
 * @property {NonNullChainwebNetworkId} networkId
 * @property {WalletConnectModalController} walletConnectModalController
 * @property {string} [pairingTopic] an existing pairing topic if resuming an existing connection. Can be obtained with this.getPairingTopic
 */

/**
 * TODO: quicksign
 *
 * WalletConnectWallet
 * Currently based on eckoWallet's implementation. Some quirks:
 * - can only handle k: accounts returned in their format (see parseKAccount() in utils.js)
 * - quicksign doesnt work (does the same thing as sign on eckoWALLET)
 *
 * References:
 * - https://docs.walletconnect.com/2.0/javascript/sign/dapp-usage
 */
export class WalletConnectWallet extends KdaWallet {
  /** @type {SignClient} */
  #signClient;

  /** @type {NonNullChainwebNetworkId} */
  #networkId;

  /**
   *
   * @param {WalletConnectCtorArgs} args
   */
  constructor(args) {
    super(args);
    this.#signClient = args.signClient;
    this.#networkId = args.networkId;
  }

  get networkId() {
    return this.#networkId;
  }

  /**
   * @returns {import("@walletconnect/types").SessionTypes.Struct} the currently active session
   */
  get session() {
    return signClientLastSession(this.#signClient);
  }

  /**
   * @returns {import("@walletconnect/types").PairingTypes.Struct} the currently active pairing
   */
  get pairing() {
    return signClientLastPairing(this.#signClient);
  }

  /**
   * @returns {string} the currently active session topic
   */
  get sessionTopic() {
    return this.session.topic;
  }

  /**
   * Save this somewhere to allow users to resume their previous
   * WalletConnect session.
   * @returns {string} the currently active pairing topic
   */
  get pairingTopic() {
    return this.pairing.topic;
  }

  static walletName() {
    return "WalletConnect";
  }

  /**
   * @override
   */
  static async isInstalled() {
    return true;
  }

  /**
   * @override
   * @param {WalletConnectConnectArgs} args
   */
  static async connect({
    signClientOptions,
    networkId,
    walletConnectModalController,
    pairingTopic,
  }) {
    const signClient = await SignClient.init(signClientOptions);
    const { uri, approval } = await signClient.connect({
      requiredNamespaces: mkRequiredNamespaces(networkId),
      pairingTopic,
    });

    /** @type {import("@walletconnect/types").SessionTypes.Struct} */
    let currSession;
    // uri returned, this is a new connection
    if (uri) {
      walletConnectModalController.openModal({ uri });
      try {
        currSession = await approval();
      } finally {
        walletConnectModalController.closeModal();
      }
    } else {
      currSession = signClientLastSession(signClient);
    }

    const {
      namespaces: {
        kadena: { accounts },
      },
    } = currSession;
    /** @type {import("@kcf/kda-wallet-base").AccountsList} */
    // @ts-ignore
    const accountsList = accounts.map(parseKAccount).filter(Boolean);
    // TODO: handle non-k: accounts

    return new WalletConnectWallet({
      accounts: accountsList,
      signClient,
      networkId,
    });
  }

  /**
   * TODO: somehow this throws
   * { message: "Unsupported wc_ method. wc_pairingDelete", code: 10001 }
   * but it looks like its still getting disconnected properly
   * @override
   */
  async disconnect() {
    await Promise.all(
      this.#signClient.core.pairing.getPairings().map(({ topic }) =>
        this.#signClient.disconnect({
          reason: {
            code: WALLETCONNECT_USER_INITIATED_ERRCODE,
            message: "user",
          },
          topic,
        })
      )
    );
  }

  /**
   * @override
   * @param {import("@kadena/client").PactCommand} cmd
   * @returns {Promise<import("@kadena/types/src/PactCommand").ICommand>}
   */
  async signCmd(cmd) {
    const resp = await this.#signClient.request({
      topic: this.sessionTopic,
      chainId: mkChainKey(this.networkId),
      request: {
        method: KADENA_SIGN_METHOD_STR,
        params: toSigningRequest(cmd),
      },
    });
    if (!resp.signedCmd) {
      throw new Error(JSON.stringify(resp));
    }
    return resp.signedCmd;
  }
}
