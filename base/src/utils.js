/**
 * Extracts the unique signers from a pact cmd's signers
 * @param {import("@kadena/client").IPactCommand["signers"]} signers
 * @returns {string[]} array of unique signer pubkeys, where first pubkey is first pubkey in signers
 */
export function signerPubkeys(signers) {
  const [sender, ...extraSigners] = signers;
  const res = [...new Set(extraSigners.map(({ pubKey }) => pubKey))];
  const i = res.indexOf(sender.pubKey);
  if (i === -1) {
    // sender does not appear in extraSigners
    res.unshift(sender.pubKey);
  } else if (i !== 0) {
    // sender appears in extraSigners, move it to front.
    // eslint-disable-next-line prefer-destructuring
    res[i] = res[0];
    res[0] = sender.pubKey;
  }
  return res;
}

/**
 * Convert a cap in cmd.signers to the form for use in the signing API
 * @param {import("@kadena/client").IPactCommand["signers"][number]["caps"][number]} signer
 * @return {import("@kadena/types").ISigningCap}
 */
export function toSigningCaps({ name, args }) {
  return {
    role: name.toUpperCase(),
    description: name,
    cap: {
      name,
      args,
    },
  };
}

/**
 * Converts a pact command to signing api request payload
 * for zelcore etc.
 * Assumes only one signer, and that all caps are granted to the
 * sole signer
 * @param {import("@kadena/client").IPactCommand} cmd
 * @return {import("@kadena/types").ISigningRequest}
 */
export function toSigningRequest({
  code,
  data,
  signers,
  networkId,
  publicMeta: { chainId, sender, gasLimit, gasPrice, ttl },
}) {
  const [signingPubKey] = signerPubkeys(signers);
  return {
    pactCode: code,
    envData: data,
    networkId,
    caps: signers.flatMap(({ caps }) => caps.map(toSigningCaps)),
    chainId,
    sender,
    gasLimit,
    gasPrice,
    ttl,
    signingPubKey,
  };
}

/**
 * Updated definition of signing request used by chainweaver
 * @typedef ISigningRequestV2
 * @property {string} code
 * @property {Record<string, unknown>} data
 * @property {import("@kadena/types").ISigningCap[]} caps
 * @property {string} nonce
 * @property {import("@kadena/client").PactCommand["publicMeta"]["chainId"]} chainId
 * @property {number} gasLimit
 * @property {number} gasPrice
 * @property {number} ttl
 * @property {string} sender
 * @property {string[]} extraSigners
 *
 */

/**
 * Converts a pact command to signing api request payload
 * for chainweaver, zelcore etc.
 * Assumes only one signer, and that all caps are granted to the
 * sole signer
 * @param {import("@kadena/client").IPactCommand} cmd
 * @return {ISigningRequestV2}
 */
export function toSigningRequestV2({
  code,
  data,
  publicMeta: { chainId, gasLimit, gasPrice, ttl, sender },
  signers,
}) {
  const [_sender, ...extraSigners] = signerPubkeys(signers);
  return {
    code,
    data,
    caps: signers.flatMap(({ caps }) => caps.map(toSigningCaps)),
    nonce: Date.now().toString(),
    chainId,
    gasLimit,
    gasPrice,
    ttl,
    sender,
    extraSigners,
  };
}
