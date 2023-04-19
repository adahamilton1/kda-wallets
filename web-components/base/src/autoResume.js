import { PKG_PREFIX } from "./consts";

export const AUTORESUME_ATTR_NAME = "autoresume";
export const AUTORESUME_LOCALSTORAGE_KEY_ATTR_NAME = "autoresumekey";

export const DEFAULT_AUTORESUME_LOCALSTORAGE_KEY = `${PKG_PREFIX}:autoResumeData`;

/**
 * @template T
 * @typedef AutoResumeData
 * @property {string} walletName
 * @property {T} data
 */

/**
 * Saves wallet auto resume data to localStorage
 * @template T
 * @param {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet
 * @param {T} data
 * @param {string} localStorageKey defaults to DEFAULT_AUTORESUME_LOCALSTORAGE_KEY
 */
export function saveAutoResumeData(
  wallet,
  data,
  localStorageKey = DEFAULT_AUTORESUME_LOCALSTORAGE_KEY
) {
  /** @type {AutoResumeData<T>} */
  const saved = {
    walletName: wallet.walletName(),
    data,
  };
  window.localStorage.setItem(localStorageKey, JSON.stringify(saved));
}

/**
 * @template T
 * @param {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet
 * @param {string} localStorageKey defaults to DEFAULT_AUTORESUME_LOCALSTORAGE_KEY
 * @returns {?AutoResumeData<T>} null if entry does not exist in localStorage or walletName does not match
 */
export function loadAutoResumeData(
  wallet,
  localStorageKey = DEFAULT_AUTORESUME_LOCALSTORAGE_KEY
) {
  const stored = window.localStorage.getItem(localStorageKey);
  if (stored === null) {
    return null;
  }
  /** @type {AutoResumeData<T>} */
  const res = JSON.parse(stored);
  if (res.walletName !== wallet.walletName()) {
    return null;
  }
  return res;
}

/**
 * Does nothing if walletnames does not match
 * @param {typeof import("@kcf/kda-wallet-base").KdaWallet} wallet
 * @param {string} localStorageKey
 */
export function deleteAutoResumeData(
  wallet,
  localStorageKey = DEFAULT_AUTORESUME_LOCALSTORAGE_KEY
) {
  const loaded = loadAutoResumeData(wallet);
  if (loaded === null || loaded.walletName !== wallet.walletName()) {
    return;
  }
  window.localStorage.removeItem(localStorageKey);
}
