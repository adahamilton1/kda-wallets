import {
  attachQuicksignSigs,
  KdaWallet,
  toCmdSigDatasAndHashes,
  toSigningRequestV1,
} from "@kcf/kda-wallet-base";
import SignClient from "@walletconnect/sign-client";
import {
  KADENA_GET_ACCOUNTS_METHOD_STR,
  KADENA_QUICKSIGN_METHOD_STR,
  KADENA_SIGN_METHOD_STR,
  WALLETCONNECT_USER_INITIATED_ERRCODE,
} from "./consts";
import {
  mkChainKey,
  mkRequiredNamespaces,
  parseKadenaPubkey,
  signClientLastPairing,
  signClientLastSession,
} from "./utils";

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
 * @property {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId} networkId
 */

/**
 * @typedef WalletConnectConnectArgs
 * @property {import("@walletconnect/types").SignClientTypes.Options} signClientOptions configure WalletConnect options such as relayURL and dapp metadata
 * @property {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId} networkId
 * @property {WalletConnectModalController} walletConnectModalController
 * @property {string} [pairingTopic] an existing pairing topic if resuming an existing connection. Can be obtained with this.getPairingTopic
 */

/**
 * @typedef KadenaGetAccountsV1Response
 * @property {RetrievedKadenaAccountAccountsEntry[]} accounts
 */

/**
 * Dont care about other fields for now
 * @typedef RetrievedKadenaAccountAccountsEntry
 * @property {string} publicKey
 * @property {{ name: string }[]} kadenaAccounts
 *
 */

/**
 * WalletConnectWallet
 *
 * Based on [KIP-0017](https://github.com/kadena-io/KIPs/blob/master/kip-0017.md)
 *
 * Currently only handles one networkId: wallet cannot change from tesnet04 to mainnet01.
 *
 * If kadena_getAccounts_v1 isnt implemented, the fallback of getting wallet accounts is to
 * do the explicitly unrecommended practice of appending `k:` to the pubkey
 *
 * References:
 * - https://docs.walletconnect.com/2.0/javascript/sign/dapp-usage
 */
export class WalletConnectWallet extends KdaWallet {
  /** @type {SignClient} */
  #signClient;

  /** @type {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId} */
  #networkId;

  /**
   * @override
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

  /** @override */
  static walletName() {
    return "WalletConnect";
  }

  /** @override */
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
    // TODO: connect() still pops up an approval on wallet despite
    // existing pairing. Find out if theres a way to remove this annoyance
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
        kadena: { accounts: walletConnectAccounts },
      },
    } = currSession;
    const accounts = await WalletConnectWallet.getAccounts(
      signClient,
      networkId,
      walletConnectAccounts
    );
    return new WalletConnectWallet({
      accounts,
      signClient,
      networkId,
    });
  }

  /**
   * TODO: somehow this throws
   * \{ message: "Unsupported wc_ method. wc_pairingDelete", code: 10001 \}
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
        params: toSigningRequestV1(cmd),
      },
    });
    if (!resp.signedCmd) {
      throw new Error(JSON.stringify(resp));
    }
    return resp.signedCmd;
  }

  /**
   * TODO: untested since no publicly available wallet implements this yet
   *
   * @override
   * @param {Array<import("@kadena/client").PactCommand>} cmds
   * @returns {Promise<Array<import("@kadena/types/src/PactCommand").ICommand>>} the signed txs, ready to JSON.stringify and send
   */
  async quickSignCmds(cmds) {
    const { cmdSigDatas, hashes } = toCmdSigDatasAndHashes(cmds);
    const result = await this.#signClient.request({
      topic: this.sessionTopic,
      chainId: mkChainKey(this.networkId),
      request: {
        method: KADENA_QUICKSIGN_METHOD_STR,
        params: { commandSigDatas: cmdSigDatas },
      },
    });
    if (!result.responses) {
      throw new Error(JSON.stringify(result));
    }
    for (const { outcome } of result.responses) {
      if (outcome.result === "failure") {
        throw new Error(outcome.msg);
      }
    }
    const sigsArray = result.responses.map(
      ({ commandSigData: { sigs } }) => sigs
    );
    return attachQuicksignSigs({ cmdSigDatas, hashes }, sigsArray);
  }

  /**
   * @param {SignClient} signClient
   * @param {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId} networkId
   * @param {string[]} walletConnectAccounts returned by connect e.g. ["kadena:mainnet01:1234...abcd",...]
   * @returns {Promise<import("@kcf/kda-wallet-base").AccountPubkey[]>}
   */
  static async getAccounts(signClient, networkId, walletConnectAccounts) {
    try {
      /** @type {KadenaGetAccountsV1Response} */
      const resp = await signClient.request({
        topic: signClientLastSession(signClient).topic,
        chainId: mkChainKey(networkId),
        request: {
          method: KADENA_GET_ACCOUNTS_METHOD_STR,
          params: {
            accounts: walletConnectAccounts.map((account) => ({ account })),
          },
        },
      });
      const { accounts } = resp;
      return accounts
        .map(({ publicKey, kadenaAccounts }) =>
          kadenaAccounts.map(({ name }) => ({
            account: name,
            pubKey: publicKey,
          }))
        )
        .flat();
    } catch (e) {
      // fallback: do the bad thing of prepending "k:"
      return walletConnectAccounts.map((walletConnectAccount) => {
        const pubKey = parseKadenaPubkey(walletConnectAccount);
        return {
          account: `k:${pubKey}`,
          pubKey,
        };
      });
    }
  }
}
