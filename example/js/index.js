import { ChainweaverWallet } from "@kcf/kda-wallet-chainweaver";

/** @type {?import("@kcf/kda-wallet-base").KdaWallet} */
let CONNECTED_WALLET = null;

const ALL_WALLETS = /** @type {const} */ (["chainweaver"]);

/** @typedef {typeof ALL_WALLETS[number]} WalletKey */

/**
 * @type {Record<WalletKey, typeof import("@kcf/kda-wallet-base").KdaWallet>}
 */
const WALLET_TO_CLASS = {
  chainweaver: ChainweaverWallet,
};

/**
 * Defaults to Class.connect({}) if not specified
 * @type {Partial<Record<WalletKey, () => Promise<import("@kcf/kda-wallet-base").KdaWallet>>>}
 */
const WALLET_TO_CONNECT_PROCEDURE = {
  chainweaver: connectChainweaverViaDialog,
};

/**
 *
 * @param {string} account
 */
function isKAccount(account) {
  return account.startsWith("k:") && account.length === 66;
}

/**
 *
 * @param {import("@kcf/kda-wallet-base").KdaWallet} wallet
 * @returns {string}
 */
function accountsDisplayStr(wallet) {
  // @ts-ignore
  const prefix = wallet.constructor.walletName();
  if (wallet.accounts.length > 1) {
    return `${prefix} (multiple accounts)`;
  }
  const { account } = wallet.accounts[0];
  return `${prefix} (${account})`;
}

/**
 * @returns {Promise<ChainweaverWallet>}
 */
async function connectChainweaverViaDialog() {
  /** @type {HTMLDialogElement} */
  // @ts-ignore
  const dialog = document.getElementById("connect-chainweaver-dialog");
  dialog.showModal();
  /** @type {HTMLFormElement} */
  // @ts-ignore
  const form = document.getElementById("connect-chainweaver-form");
  /** @type {HTMLInputElement} */
  // @ts-ignore
  const kInput = document.getElementById("chainweaver-address-input");
  return new Promise((resolve, reject) => {
    dialog.onclose = () => reject(new Error("dialog closed"));

    form.onsubmit = (event) => {
      event.preventDefault();
      const account = kInput.value;
      if (!isKAccount(account)) {
        alert("only k: accounts supported");
        dialog.close();
        return;
      }
      dialog.onclose = null;
      dialog.close();
      resolve(
        ChainweaverWallet.connect({
          accounts: [{ account, pubKey: account.substring(2) }],
        })
      );
    };
  });
}

function onConnectedWalletChanged() {
  /** @type {HTMLHeadingElement} */
  // @ts-ignore
  const h2 = document.getElementById("wallet-select-label");
  if (CONNECTED_WALLET) {
    h2.innerText = accountsDisplayStr(CONNECTED_WALLET);
  } else {
    h2.innerText = "Select a Wallet to Connect";
  }
}

/**
 *
 * @param {WalletKey} walletKey
 */
function createConnectWalletButton(walletKey) {
  const button = document.createElement("button");
  const cls = WALLET_TO_CLASS[walletKey];
  button.innerText = cls.walletName();
  const connectFn =
    WALLET_TO_CONNECT_PROCEDURE[walletKey] ?? (() => cls.connect({}));
  button.onclick = async () => {
    if (CONNECTED_WALLET) {
      alert("disconnect wallet first");
      return;
    }
    // try-catch here to handle connect errors gracefully
    const wallet = await connectFn();
    CONNECTED_WALLET = wallet;
    onConnectedWalletChanged();
  };
  cls.isInstalled().then((isInstalled) => {
    if (!isInstalled) {
      button.disabled = true;
    }
  });
  return button;
}

function createConnectWalletButtons() {
  const connectWalletButtons = ALL_WALLETS.map(createConnectWalletButton);
  /** @type {HTMLDivElement} */
  // @ts-ignore
  const section = document.getElementById("wallet-select-section");
  section.append(...connectWalletButtons);
}

function setupDisconnectWalletButton() {
  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const btn = document.getElementById("disconnect-button");
  btn.onclick = async () => {
    if (!CONNECTED_WALLET) {
      alert("no wallet connected");
      return;
    }
    await CONNECTED_WALLET.disconnect();
    CONNECTED_WALLET = null;
    onConnectedWalletChanged();
  };
}

function onPageParsed() {
  createConnectWalletButtons();
  setupDisconnectWalletButton();
}

onPageParsed();
