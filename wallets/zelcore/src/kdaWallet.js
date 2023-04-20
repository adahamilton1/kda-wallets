import { KdaWallet, toSigningRequestV1 } from "@kcf/kda-wallet-base";
import axios, { Axios } from "axios";
import { openZelcore } from "./utils";

/**
 * @typedef {ZelcoreAccountsSuccessResponse | ZelcoreAccountsFailureResponse} ZelcoreAccountsResponse
 */

/**
 * @typedef ZelcoreAccountsSuccessResponse
 * @property {"error"} status
 * @property {string} data
 */

/**
 * @typedef ZelcoreAccountsFailureResponse
 * @property {"success"} status
 * @property {string[]} data where data[i] is account data[i+1] is pubkey for all even i
 */

const API_V1_ENDPOINT = "http://localhost:9467/v1";
const ACCOUNTS_ENDPOINT = "accounts";
const SIGN_ENDPOINT = "sign";

/**
 * Zelcore
 *
 * Does not implement quicksign
 */
export class ZelcoreWallet extends KdaWallet {
  /** @type {Axios} */
  #axios;

  /**
   * @override
   * @param {import("@kcf/kda-wallet-base").CtorArgs} args
   */
  constructor(args) {
    super(args);
    this.#axios = new Axios({
      baseURL: API_V1_ENDPOINT,
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: (status) => status === 200,
    });
  }

  /** @override */
  static walletName() {
    return "Zelcore";
  }

  /** @override */
  static async isInstalled() {
    try {
      // error will show up on console but will not throw
      await axios.get(`${API_V1_ENDPOINT}/${SIGN_ENDPOINT}`, {
        // zelcore returns 404 when attempting GET
        validateStatus: (status) => status === 404,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @override
   * @returns {Promise<ZelcoreWallet>}
   */
  static async connect() {
    openZelcore();
    const { data } = await axios.post(
      `${API_V1_ENDPOINT}/${ACCOUNTS_ENDPOINT}`,
      { asset: "kadena" }
    );
    /** @type {ZelcoreAccountsResponse} */
    const resp = data;
    if (resp.status !== "success") {
      throw new Error(resp.data);
    }
    const accounts = [];
    for (let i = 0; i < resp.data.length; i += 2) {
      const account = resp.data[i];
      const pubKey = resp.data[i + 1];
      accounts.push({ account, pubKey });
    }
    return new ZelcoreWallet({ accounts });
  }

  /** @override */
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  async disconnect() {}

  /**
   * @override
   * @param {import("@kadena/client").PactCommand} cmd
   * @returns {Promise<import("@kadena/types/src/PactCommand").ICommand>}
   */
  async signCmd(cmd) {
    openZelcore();
    const { data } = await this.#axios.post(
      SIGN_ENDPOINT,
      JSON.stringify(toSigningRequestV1(cmd))
    );
    // axios isnt parsing return data as json for some reason
    return typeof data === "string" ? JSON.parse(data).body : data.body;
  }
}
