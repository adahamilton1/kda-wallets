import {
  attachQuicksignSigs,
  KdaWallet,
  toCmdSigDatasAndHashes,
  toSigningRequest,
} from "@kcf/kda-wallet-base";

/**
 * TODO: import this type from base package instead (BREAKING)
 * @typedef {Exclude<import("@kadena/types").ChainwebNetworkId, undefined>} NonNullChainwebNetworkId
 */

/**
 * @typedef EckoWalletCtorArgs
 * @property {import("@kcf/kda-wallet-base").AccountsList} accounts
 * @property {NonNullChainwebNetworkId} networkId
 */

/**
 * @typedef EckoWalletConnectArgs
 * @property {NonNullChainwebNetworkId} networkId
 */

/**
 * TODO: verify "fail" and "success" are only possible status strings
 * @template T
 * @typedef {EckoWalletSuccessResponse<T> | EckoWalletFailResponse} EckoWalletResponse
 */

/**
 * @typedef EckoWalletFailResponse
 * @property {"fail"} status
 * @property {string} message
 */

/**
 * @template T
 * @typedef {{ status: "success"} & T} EckoWalletSuccessResponse
 */

/**
 * @typedef EckoWalletSignedCmd
 * @property {import("@kadena/types/src/PactCommand").ICommand} signedCmd
 */

/**
 * @typedef EckoWalletQuickSignedData
 * @property {import("@kadena/client").IQuicksignResponseOutcomes["responses"]} quickSignData
 */

/**
 * eckoWALLET browser plugin
 */
export class EckoWallet extends KdaWallet {
  /** @type {NonNullChainwebNetworkId} */
  #networkId;

  /**
   * @returns {NonNullChainwebNetworkId}
   */
  get networkId() {
    return this.#networkId;
  }

  /**
   * @override
   * @param {EckoWalletCtorArgs} args
   */
  constructor(args) {
    super(args);
    this.#networkId = args.networkId;
  }

  /** @override */
  static walletName() {
    return "eckoWALLET";
  }

  /** @override */
  static async isInstalled() {
    // @ts-ignore
    return Boolean(window && window.kadena && window.kadena.isKadena);
  }

  /**
   * @override
   * @param {EckoWalletConnectArgs} _args
   */
  static async connect({ networkId }) {
    const maybeEcko = await initIfConn(networkId);
    if (maybeEcko) {
      return maybeEcko;
    }
    // @ts-ignore
    const { kadena } = window;
    const resp = await kadena.request({
      method: "kda_connect",
      networkId,
    });
    if (resp.status !== "success") {
      throw new Error(JSON.stringify(resp));
    }
    const ecko = await initIfConn(networkId);
    if (!ecko) {
      throw new Error("Ecko wallet did not finish connecting");
    }
    return ecko;
  }

  /** @override */
  async disconnect() {
    // @ts-ignore
    const { kadena } = window;
    await kadena.request({
      method: "kda_disconnect",
      networkId: this.networkId,
    });
  }

  /**
   * @override
   * @param {import("@kadena/client").PactCommand} cmd
   * @returns {Promise<import("@kadena/types/src/PactCommand").ICommand>}
   */
  async signCmd(cmd) {
    // @ts-ignore
    const { kadena } = window;
    /** @type {EckoWalletResponse<EckoWalletSignedCmd>}  */
    const resp = await kadena.request({
      method: "kda_requestSign",
      data: {
        networkId: this.networkId,
        signingCmd: toSigningRequest(cmd),
      },
    });
    if (resp.status !== "success") {
      throw new Error(JSON.stringify(resp));
    }
    return resp.signedCmd;
  }

  /**
   * TODO: currently keeps throwing
   * \{status":"fail","error":"QuickSign fail: wallet public key not found"\}
   * check ecko discord
   * @override
   * @param {Array<import("@kadena/client").PactCommand>} cmds
   * @returns {Promise<Array<import("@kadena/types/src/PactCommand").ICommand>>}
   */
  async quickSignCmds(cmds) {
    const { cmdSigDatas, hashes } = toCmdSigDatasAndHashes(cmds);
    // @ts-ignore
    const { kadena } = window;
    /** @type {EckoWalletResponse<EckoWalletQuickSignedData>}  */
    const resp = await kadena.request({
      method: "kda_requestQuickSign",
      data: {
        networkId: this.networkId,
        commandSigDatas: cmdSigDatas,
      },
    });
    if (resp.status !== "success") {
      throw new Error(JSON.stringify(resp));
    }
    const sigsArray = resp.quickSignData.map(
      ({ commandSigData: { sigs } }) => sigs
    );
    return attachQuicksignSigs({ cmdSigDatas, hashes }, sigsArray);
  }
}

/**
 * @param {NonNullChainwebNetworkId} networkId
 * @returns {Promise<EckoWallet | null>}
 */
async function initIfConn(networkId) {
  // @ts-ignore
  const { kadena } = window;
  const isAlrdyConn = await kadena.request({
    method: "kda_checkStatus",
    networkId,
  });
  if (isAlrdyConn.status !== "success") {
    return null;
  }
  const {
    account: { account, publicKey },
  } = isAlrdyConn;
  return new EckoWallet({
    accounts: [
      {
        account,
        pubKey: publicKey,
      },
    ],
    networkId,
  });
}
