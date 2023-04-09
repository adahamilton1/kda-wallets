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
 * Converts a pact command to signing api request payload.
 * This is based on the `execCmd` object schema used in pact-lang-api:
 * https://github.com/kadena-io/pact-lang-api/blob/fd04d695e6a4ea2203308f25fc781185e0bb3e0a/pact-lang-api.js#L573
 *
 * Assumes only one signer, and that all caps are granted to the
 * sole signer.
 *
 * Used by:
 * - eckoWALLET extension
 * - WalletConnect
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
 * Definition of signing request used by pact-lang-api wallet.
 * See https://github.com/kadena-io/pact-lang-api/blob/fd04d695e6a4ea2203308f25fc781185e0bb3e0a/pact-lang-api.js#L812-L824
 *
 * @typedef ISigningRequestV1
 * @property {string} code
 * @property {Record<string, unknown>} data
 * @property {import("@kadena/types").ISigningCap[]} caps
 * @property {string} nonce
 * @property {import("@kadena/client").PactCommand["publicMeta"]["chainId"]} chainId
 * @property {number} gasLimit
 * @property {number} gasPrice
 * @property {number} ttl
 * @property {string} sender
 * @property {string} signingPubKey
 * @property {import("@kadena/types").NetworkId} networkId
 *
 */

/**
 * Converts a pact command to signing api request payload.
 * This is the original schema, based on https://github.com/kadena-io/pact-lang-api/blob/fd04d695e6a4ea2203308f25fc781185e0bb3e0a/pact-lang-api.js#L812-L824
 *
 * Assumes only one signer, and that all caps are granted to the sole signer
 *
 * Used by:
 * - zelcore
 *
 * @param {import("@kadena/client").IPactCommand} cmd
 * @return {ISigningRequestV1}
 */
export function toSigningRequestV1({
  code,
  data,
  publicMeta: { chainId, gasLimit, gasPrice, ttl, sender },
  signers,
  networkId,
}) {
  const [signingPubKey] = signerPubkeys(signers);
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
    networkId,
    signingPubKey,
  };
}

/**
 * Updated definition of signing request used by chainweaver.
 * See https://kadena-io.github.io/signing-api/
 *
 * Differences with ISigningRequestV1
 * - has extraSigners field
 * - no signingPubKey field
 * - no networkId field
 *
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
 * Converts a pact command to signing api request payload.
 * This is the updated schema, based on https://kadena-io.github.io/signing-api/#/definitions/SigningRequest
 *
 * Assumes only one signer, and that all caps are granted to the sole signer
 *
 * Used by:
 * - chainweaver
 *
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

/**
 * @typedef CmdSigDatasAndHashes
 * @property {import("@kadena/client").IUnsignedQuicksignTransaction[]} cmdSigDatas
 * @property {string[]} hashes
 */

/**
 * For quicksign.
 * @param {Array<import("@kadena/client").PactCommand>} cmds
 * @returns {CmdSigDatasAndHashes} where cmdSigDatas is ready to be sent to a quicksign request endpoint
 */
export function toCmdSigDatasAndHashes(cmds) {
  return cmds.reduce(({ cmdSigDatas, hashes }, cmd) => {
    const { cmd: cmdStr, hash } = cmd.createCommand();
    const sigs = signerPubkeys(cmd.signers).map((pubkey) => ({
      pubKey: pubkey,
      sig: null,
    }));
    cmdSigDatas.push({
      cmd: cmdStr,
      sigs,
    });
    hashes.push(hash);
    return { cmdSigDatas, hashes };
  }, /** @type {CmdSigDatasAndHashes} */ ({ cmdSigDatas: [], hashes: [] }));
}

/**
 * Create an array of ICommands ready to post to the network
 * by attaching the signatures received from a successful quicksign request
 * @param {CmdSigDatasAndHashes} _cmdSigDataAndHashes
 * @param {import("@kadena/client").IQuicksignSigner[][]} sigsArray
 * @return {import("@kadena/types/src/PactCommand").ICommand[]}
 */
export function attachQuicksignSigs({ cmdSigDatas, hashes }, sigsArray) {
  return cmdSigDatas.map(({ cmd }, i) => {
    const hash = hashes[i];
    const sigs = sigsArray[i];
    return {
      cmd,
      hash,
      // filter non-null and remove pubKey field
      sigs: sigs.filter(({ sig }) => Boolean(sig)).map(({ sig }) => ({ sig })),
    };
  });
}

/**
 * @param {string} account
 * @returns {boolean}
 */
export function isKAccount(account) {
  return account.match(/^k:[0-9A-Fa-f]{64}$/) !== null;
}

/**
 * Extracts the pubkey from a k: account
 * @param {string} kAccount
 * @returns {string}
 */
export function kAccountPubkey(kAccount) {
  return kAccount.substring(2);
}
