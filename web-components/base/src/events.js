import { PKG_PREFIX } from "./consts";

export const WALLET_CONNECTED_EVENT_NAME = `${PKG_PREFIX}:connected`;

/**
 * @typedef WalletConnectedEvent
 * @property {import("@kcf/kda-wallet-base").KdaWallet} wallet
 */

/**
 * Create a "wallet connected" event
 *
 * @param {import("@kcf/kda-wallet-base").KdaWallet} wallet
 * @returns {CustomEvent<WalletConnectedEvent>} the newly created wallet
 */
export function mkWalletConnectedEvent(wallet) {
  return new CustomEvent(WALLET_CONNECTED_EVENT_NAME, {
    detail: { wallet },
    bubbles: true,
  });
}
