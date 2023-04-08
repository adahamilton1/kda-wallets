import { isKAccount, kAccountPubkey } from "@kcf/kda-wallet-base";
import { KADENA_SIGN_METHOD_STR } from "./consts";

/**
 * @param {import("./kdaWallet").NonNullChainwebNetworkId} networkId
 * @returns {string}
 */
export function mkChainKey(networkId) {
  return `kadena:${networkId}`;
}

/**
 * @param {import("./kdaWallet").NonNullChainwebNetworkId} networkId
 * @returns {import("@walletconnect/types").ProposalTypes.RequiredNamespaces}
 */
export function mkRequiredNamespaces(networkId) {
  return {
    kadena: {
      methods: ["kadena_quicksign", KADENA_SIGN_METHOD_STR],
      chains: [mkChainKey(networkId)],
      events: ["kadena_transaction_updated"],
    },
  };
}

/**
 * @param {string} maybeKAcc kAcc string returned from walletconnect. e.g. `kadena:mainnet01:k**1234...cdef`
 * @returns {?import("@kcf/kda-wallet-base").AccountPubkey} null if not k account
 */
export function parseKAccount(maybeKAcc) {
  try {
    const kAcc = maybeKAcc.split(":")[2].replace("**", ":").trim();
    if (!isKAccount(kAcc)) {
      return null;
    }
    return {
      account: kAcc,
      pubKey: kAccountPubkey(kAcc),
    };
  } catch (e) {
    return null;
  }
}

/**
 * @param {import("@walletconnect/sign-client").default} signClient
 * @returns {import("@walletconnect/types").PairingTypes.Struct}
 */
export function signClientLastPairing(signClient) {
  const pairings = signClient.core.pairing.getPairings();
  return pairings[pairings.length - 1];
}

/**
 * @param {import("@walletconnect/sign-client").default} signClient
 * @returns {import("@walletconnect/types").SessionTypes.Struct}
 */
export function signClientLastSession(signClient) {
  const pairings = signClient.session.getAll();
  return pairings[pairings.length - 1];
}
