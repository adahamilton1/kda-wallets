import { PKG_PREFIX } from "./consts";

/**
 * @typedef WalletBeginConnectEvent
 * @property {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet
 */

/**
 * @typedef WalletAbandonConnectEvent
 * @property {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet
 */

/**
 * @typedef WalletConnectedEvent
 * @property {import("@kcf/kda-wallet-base").KdaWallet} wallet
 */

/**
 * @typedef WalletDisconnectedEvent
 * @property {import("@kcf/kda-wallet-base").KdaWallet} wallet
 */

/**
 * @typedef WalletErrorEvent
 * @property {Error} error
 */

export const WALLET_BEGIN_CONNECT_EVENT_NAME = `${PKG_PREFIX}:beginconnect`;

export const WALLET_ABANDON_CONNECT_EVENT_NAME = `${PKG_PREFIX}:abandonconnect`;

export const WALLET_CONNECTED_EVENT_NAME = `${PKG_PREFIX}:connected`;

export const WALLET_DISCONNECTED_EVENT_NAME = `${PKG_PREFIX}:disconnected`;

export const WALLET_ERROR_EVENT_NAME = `${PKG_PREFIX}:error`;

/**
 * @param {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet class of the wallet that began the connection attempt
 * @returns {CustomEvent<WalletBeginConnectEvent>}
 */
export function mkWalletBeginConnectEvent(wallet) {
  return new CustomEvent(WALLET_BEGIN_CONNECT_EVENT_NAME, {
    detail: { wallet },
    bubbles: true,
  });
}

/**
 * @param {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet class of the wallet that abandoned the connecton attempt
 * @returns {CustomEvent<WalletAbandonConnectEvent>}
 */
export function mkWalletAbandonConnectEvent(wallet) {
  return new CustomEvent(WALLET_ABANDON_CONNECT_EVENT_NAME, {
    detail: { wallet },
    bubbles: true,
  });
}

/**
 * @param {import("@kcf/kda-wallet-base").KdaWallet} wallet the newly created wallet
 * @returns {CustomEvent<WalletConnectedEvent>}
 */
export function mkWalletConnectedEvent(wallet) {
  return new CustomEvent(WALLET_CONNECTED_EVENT_NAME, {
    detail: { wallet },
    bubbles: true,
  });
}

/**
 * @param {import("@kcf/kda-wallet-base").KdaWallet} wallet the disconnected wallet. signCmds and quickSignCmds should NOT be called
 * @returns {CustomEvent<WalletDisconnectedEvent>}
 */
export function mkWalletDisconnectedEvent(wallet) {
  return new CustomEvent(WALLET_DISCONNECTED_EVENT_NAME, {
    detail: { wallet },
    bubbles: true,
  });
}

/**
 * @param {Error} error
 * @returns {CustomEvent<WalletErrorEvent>}
 */
export function mkWalletErrorEvent(error) {
  return new CustomEvent(WALLET_ERROR_EVENT_NAME, {
    detail: { error },
    bubbles: true,
  });
}
