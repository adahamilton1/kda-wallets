import {
  KdaWallet,
  signerPubkeys,
  toSigningRequestV2,
} from "@kcf/kda-wallet-base";
import axios, { Axios } from "axios";

const API_V1_ENDPOINT = "http://localhost:9467/v1";
const SIGN_ENDPOINT = "sign";
const QUICKSIGN_ENDPOINT = "quicksign";

export class ChainweaverWallet extends KdaWallet {
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

  /**
   * @override
   */
  static walletName() {
    return "chainweaver";
  }

  /**
   * @override
   */
  static async isInstalled() {
    try {
      // error will show up on console but will not throw
      await axios.get(`${API_V1_ENDPOINT}/${SIGN_ENDPOINT}`, {
        validateStatus: (status) => status === 405,
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * @override chainweaver requires additional user input of account + pubkey
   * @param {Partial<import("@kcf/kda-wallet-base").CtorArgs>} args
   */
  static async connect({ accounts }) {
    if (!accounts || accounts.length === 0) {
      throw new Error(
        "insufficient account info. Need at least 1 account + pubkey provided"
      );
    }
    return new ChainweaverWallet({ accounts });
  }

  /**
   * @override
   */
  // eslint-disable-next-line class-methods-use-this, no-empty-function
  async disconnect() {}

  /**
   * @override
   * @param {import("@kadena/client").PactCommand} cmd
   * @returns {Promise<import("@kadena/types/src/PactCommand").ICommand>}
   */
  async signCmd(cmd) {
    const { data } = await this.#axios.post(
      SIGN_ENDPOINT,
      JSON.stringify(toSigningRequestV2(cmd))
    );
    // axios isnt parsing return data as json for some reason
    return typeof data === "string" ? JSON.parse(data).body : data.body;
  }

  /**
   * @override
   * @param {Array<import("@kadena/client").PactCommand>} cmds
   * @returns {Promise<Array<import("@kadena/types/src/PactCommand").ICommand>>}
   */
  async quickSignCmds(cmds) {
    const [cmdSigDatas, hashes] = cmds.reduce(([c, h], cmd) => {
      const { cmd: cmdStr, hash } = cmd.createCommand();
      const sigs = signerPubkeys(cmd.signers).map((pubkey) => ({
        pubKey: pubkey,
        sig: null,
      }));
      c.push({
        cmd: cmdStr,
        sigs,
      });
      h.push(hash);
      return [c, h];
    }, /** @type {[import("@kadena/client").IUnsignedQuicksignTransaction[], string[]]} */ ([[], []]));
    const { data } = await this.#axios.post(
      QUICKSIGN_ENDPOINT,
      JSON.stringify({
        cmdSigDatas,
      })
    );
    // axios isnt parsing return data as json for some reason
    /** @type {import("@kadena/client").IQuicksignResponseOutcomes} */
    const { responses } = typeof data === "string" ? JSON.parse(data) : data;
    for (const { outcome } of responses) {
      if (outcome.result === "failure") {
        throw new Error(outcome.msg);
      }
    }
    return cmdSigDatas.map(({ cmd }, i) => {
      const hash = hashes[i];
      const {
        commandSigData: { sigs },
      } = responses[i];
      return {
        cmd,
        hash,
        // filter non-null and remove pubKey field
        sigs: sigs
          .filter(({ sig }) => Boolean(sig))
          .map(({ sig }) => ({ sig })),
      };
    });
  }
}
