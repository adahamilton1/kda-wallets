import { UnimplementedError } from "./errs";

/**
 * @typedef CtorArgs
 * @property {Record<string, string>} accounts map of the wallet's accounts to their corresponding pubkey
 */

export class KdaWallet {
  /** @type {Record<string, string>} */
  #accounts;

  /**
   *
   * @param {CtorArgs} param0
   */
  constructor({ accounts }) {
    this.#accounts = accounts;
  }

  /**
   * Returns map of the wallet's accounts to their corresponding pubkey
   * @returns {Record<string, string>}
   */
  get accounts() {
    return this.#accounts;
  }

  /**
   * Checks if this wallet is installed and
   * available for use
   * @returns {Promise<boolean>}
   */
  static async isInstalled() {
    throw new UnimplementedError();
  }

  /**
   * Connect and instantiate the wallet
   * @param {Partial<CtorArgs>} _args
   * @returns {Promise<KdaWallet>}
   * @throws if connection failed
   */
  static async connect(_args) {
    throw new UnimplementedError();
  }

  /**
   * Disconnect the wallet and cleanup.
   * The wallet should be safe to delete/gc after calling this.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this
  async disconnect() {
    throw new UnimplementedError();
  }

  /**
   * Signs a pact transaction
   * @param {import("@kadena/client").PactCommand} _cmd
   * @returns {Promise<import("@kadena/types/src/PactCommand").ICommand>} the signed tx, ready to JSON.stringify and send
   * @throws if signing failed
   */
  // eslint-disable-next-line class-methods-use-this
  async signCmd(_cmd) {
    throw new UnimplementedError();
  }

  /**
   * Quicksigns an array of pact transactions
   * @param {Array<import("@kadena/client").PactCommand>} _cmds
   * @returns {Promise<Array<import("@kadena/types/src/PactCommand").ICommand>>} the signed txs, ready to JSON.stringify and send
   * @throws if signing failed
   */
  // eslint-disable-next-line class-methods-use-this
  async quickSignCmds(_cmds) {
    throw new UnimplementedError();
  }
}
