import { UnimplementedError } from "./errs";

/**
 * Array of {account, pubKey} that the wallet can sign for
 * Most wallets will just have one item in this array.
 * @typedef {Array<{ account: string, pubKey: string }>} AccountsList
 */

/**
 * @typedef CtorArgs
 * @property {AccountsList} accounts list of the wallet's accounts and their corresponding pubkeys
 */

/**
 * The abstract base class for Kadena wallets to extend
 */
export class KdaWallet {
  /** @type {AccountsList} */
  #accounts;

  /**
   *
   * @param {CtorArgs} param0
   */
  constructor({ accounts }) {
    this.#accounts = accounts;
  }

  /**
   * Returns list of the wallet's accounts and their corresponding pubkeys
   * @returns {AccountsList}
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
