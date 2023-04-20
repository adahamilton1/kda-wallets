import {
  KADENA_GET_ACCOUNTS_METHOD_STR,
  KADENA_QUICKSIGN_METHOD_STR,
  KADENA_SIGN_METHOD_STR,
} from "./consts";

/**
 * @param {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId} networkId
 * @returns {string}
 */
export function mkChainKey(networkId) {
  return `kadena:${networkId}`;
}

/**
 * @param {import("@kcf/kda-wallet-base").NonNullChainwebNetworkId} networkId
 * @returns {import("@walletconnect/types").ProposalTypes.RequiredNamespaces}
 */
export function mkRequiredNamespaces(networkId) {
  return {
    kadena: {
      methods: [
        KADENA_GET_ACCOUNTS_METHOD_STR,
        KADENA_QUICKSIGN_METHOD_STR,
        KADENA_SIGN_METHOD_STR,
      ],
      chains: [mkChainKey(networkId)],
      events: [],
    },
  };
}

/**
 * @param {string} walletConnectAccount account string returned from walletconnect. e.g. `kadena:mainnet01:1234...cdef`
 * @returns {string} pubkey
 */
export function parseKadenaPubkey(walletConnectAccount) {
  return walletConnectAccount.split(":")[2].trim();
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
