import { PactCommand } from "@kadena/client";
import { ChainweaverWallet } from "@kcf/kda-wallet-chainweaver";
import axios from "axios";

/** @type {?import("@kcf/kda-wallet-base").KdaWallet} */
let CONNECTED_WALLET = null;

const CHAINWEB_LOCAL_ENDPOINT =
  "https://api.testnet.chainweb.com/chainweb/0.0/testnet04/chain/1/pact/api/v1/local";

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
 * @returns {import("@kadena/client").PactCommand}
 */
function transferPactCmd() {
  /** @type {HTMLInputElement} */
  // @ts-ignore
  const amtInput = document.getElementById("transfer-amount-input");
  /** @type {HTMLInputElement} */
  // @ts-ignore
  const toInput = document.getElementById("transfer-to-input");

  const amtVal = amtInput.value;
  const toVal = toInput.value;
  if (!amtVal || !toVal) {
    throw new Error("missing input");
  }
  const amt = Number(amtVal);
  if (amt < 0 || Number.isNaN(amt) || !Number.isFinite(amt)) {
    throw new Error("invalid amount");
  }
  if (!CONNECTED_WALLET) {
    throw new Error("wallet not connected");
  }
  const { account: sender, pubKey } = CONNECTED_WALLET.accounts[0];
  /** @type {import("@kadena/client").PactCommand} */
  // @ts-ignore
  const res = new PactCommand();
  res.code = `(coin.transfer "${sender}" "${toVal}" ${amt.toFixed(14)})`;
  res.setMeta(
    {
      sender,
      chainId: "1",
      ttl: 600,
      gasLimit: 2500,
      gasPrice: 1e-7,
    },
    "testnet04"
  );
  res.addCap("coin.GAS", pubKey);
  // @ts-ignore
  res.addCap("coin.TRANSFER", pubKey, sender, toVal, amt);
  return res;
}

/**
 * @param {import("@kadena/types/src/PactCommand").ICommand} cmd
 */
async function simulateSignedCmd(cmd) {
  const { data } = await axios.post(CHAINWEB_LOCAL_ENDPOINT, cmd, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  /** @type {HTMLParagraphElement} */
  // @ts-ignore
  const resultP = document.getElementById("local-result");
  console.log(data);
  resultP.innerText = JSON.stringify(data);
}

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

  ["sign-button", "quicksign-button"].forEach((id) => {
    /** @type {HTMLButtonElement} */
    // @ts-ignore
    const btn = document.getElementById(id);
    if (CONNECTED_WALLET) {
      btn.removeAttribute("disabled");
    } else {
      btn.setAttribute("disabled", "1");
    }
  });

  /** @type {HTMLParagraphElement} */
  // @ts-ignore
  const resultP = document.getElementById("local-result");
  resultP.innerText = "";
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

function setupTransferForm() {
  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const signBtn = document.getElementById("sign-button");
  signBtn.onclick = async () => {
    const cmd = transferPactCmd();
    if (!CONNECTED_WALLET) {
      return;
    }
    const signed = await CONNECTED_WALLET.signCmd(cmd);
    await simulateSignedCmd(signed);
  };

  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const quickSignBtn = document.getElementById("quicksign-button");
  quickSignBtn.onclick = async () => {
    const cmd = transferPactCmd();
    if (!CONNECTED_WALLET) {
      return;
    }
    const [signed] = await CONNECTED_WALLET.quickSignCmds([cmd]);
    await simulateSignedCmd(signed);
  };
}

function onPageParsed() {
  createConnectWalletButtons();
  setupDisconnectWalletButton();
  setupTransferForm();

  onConnectedWalletChanged();
}

onPageParsed();
