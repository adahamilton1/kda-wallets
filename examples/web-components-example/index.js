import { PactCommand } from "@kadena/client";
import { defineCustomElement as defineChainweaverConnectButton } from "@kcf/kda-wallet-chainweaver-connect-button";
import { defineCustomElement as defineEckoWalletConnectButton } from "@kcf/kda-wallet-eckowallet-connect-button";
import { defineCustomElement as defineConnectDialog } from "@kcf/kda-wallet-connect-dialog";
import { defineCustomElement as defineWalletconnectConnectButton } from "@kcf/kda-wallet-walletconnect-connect-button";
import { defineCustomElement as defineZelcoreConnectButton } from "@kcf/kda-wallet-zelcore-connect-button";
import {
  WALLET_ABANDON_CONNECT_EVENT_NAME,
  WALLET_BEGIN_CONNECT_EVENT_NAME,
  WALLET_CONNECTED_EVENT_NAME,
  WALLET_DISCONNECTED_EVENT_NAME,
  WALLET_ERROR_EVENT_NAME,
} from "@kcf/kda-wallet-web-components-base";
import axios from "axios";

const NETWORK_ID = "testnet04";
const CHAIN_ID = "1";
const TTL_S = 600;
const GAS_LIMIT = 2500;
const GAS_PRICE = 1e-7;

const CHAINWEB_LOCAL_ENDPOINT = `https://api.testnet.chainweb.com/chainweb/0.0/${NETWORK_ID}/chain/${CHAIN_ID}/pact/api/v1/local`;

/** @returns {import("@kcf/kda-wallet-connect-dialog").KdaWalletConnectDialog} */
function getConnectDialog() {
  // @ts-ignore
  return document.querySelector("kda-wallet-connect-dialog");
}

/** @returns {HTMLHeadingElement} */
function getConnectedWalletLabel() {
  // @ts-ignore
  return document.getElementById("connected-wallet-label");
}

/** @returns {HTMLButtonElement} */
function getConnectWalletButton() {
  // @ts-ignore
  return document.getElementById("connect-wallet-button");
}

/** @returns {HTMLButtonElement} */
function getDisconnectWalletButton() {
  // @ts-ignore
  return document.getElementById("disconnect-wallet-button");
}

/** @returns {?import("@kcf/kda-wallet-base").KdaWallet} */
function getConnectedWallet() {
  return getConnectDialog().connectedWallet;
}

/**
 *
 * @param {import("@kcf/kda-wallet-base").KdaWallet} wallet
 * @returns {string}
 */
function accountsDisplayStr(wallet) {
  // @ts-ignore
  const walletName = wallet.constructor.walletName();
  const { account } = wallet.accounts[0];
  const res = `${walletName} (${account})`;
  if (wallet.accounts.length === 1) {
    return res;
  }
  return `${res} (multiple accounts)`;
}

/**
 * Create the simple transfer transaction from form inputs
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
  const connectedWallet = getConnectedWallet();
  if (!connectedWallet) {
    throw new Error("wallet not connected");
  }
  const { account: sender, pubKey } = connectedWallet.accounts[0];
  const res = new PactCommand();
  res.code = `(coin.transfer "${sender}" "${toVal}" ${amt.toFixed(14)})`;
  res.setMeta(
    {
      sender,
      chainId: CHAIN_ID,
      ttl: TTL_S,
      gasLimit: GAS_LIMIT,
      gasPrice: GAS_PRICE,
    },
    NETWORK_ID
  );
  res.addCap("coin.GAS", pubKey);
  // @ts-ignore
  res.addCap("coin.TRANSFER", pubKey, sender, toVal, amt);
  return res;
}

function setupConnectWalletButton() {
  getConnectWalletButton().onclick = () => {
    getConnectDialog().showModal();
  };
}

function setupDisconnectWalletButton() {
  getDisconnectWalletButton().onclick = () => {
    const dialog = getConnectDialog();
    if (dialog.connectedConnectWalletButton == null) {
      alert("no wallet connected");
      return;
    }
    dialog.disconnect();
  };
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

function setupTransferForm() {
  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const signBtn = document.getElementById("sign-button");
  signBtn.onclick = async () => {
    const cmd = transferPactCmd();
    const connectedWallet = getConnectedWallet();
    if (!connectedWallet) {
      return;
    }
    const signed = await connectedWallet.signCmd(cmd);
    await simulateSignedCmd(signed);
  };

  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const quickSignBtn = document.getElementById("quicksign-button");
  quickSignBtn.onclick = async () => {
    const cmd = transferPactCmd();
    const connectedWallet = getConnectedWallet();
    if (!connectedWallet) {
      return;
    }
    const [signed] = await connectedWallet.quickSignCmds([cmd]);
    await simulateSignedCmd(signed);
  };
}

/**
 * @param {CustomEvent<import("@kcf/kda-wallet-web-components-base").WalletConnectedEvent>} _evt
 */
function onWalletConnected({ detail: { wallet } }) {
  getConnectedWalletLabel().innerText = accountsDisplayStr(wallet);
  getConnectWalletButton().setAttribute("disabled", "1");
  getDisconnectWalletButton().removeAttribute("disabled");
}

/**
 * @param {CustomEvent<import("@kcf/kda-wallet-web-components-base").WalletDisconnectedEvent>} _evt
 */
function onWalletDisconnected(_evt) {
  getConnectedWalletLabel().innerText = "";
  getConnectWalletButton().removeAttribute("disabled");
  getDisconnectWalletButton().setAttribute("disabled", "1");
}

function onPageParsed() {
  // web components define
  defineConnectDialog();
  defineChainweaverConnectButton();
  defineEckoWalletConnectButton();
  defineWalletconnectConnectButton();
  defineZelcoreConnectButton();

  setupConnectWalletButton();
  setupDisconnectWalletButton();
  setupTransferForm();

  document.addEventListener(WALLET_CONNECTED_EVENT_NAME, onWalletConnected);
  document.addEventListener(
    WALLET_DISCONNECTED_EVENT_NAME,
    onWalletDisconnected
  );
  document.addEventListener(WALLET_BEGIN_CONNECT_EVENT_NAME, console.log);
  document.addEventListener(WALLET_ABANDON_CONNECT_EVENT_NAME, console.log);
  document.addEventListener(WALLET_ERROR_EVENT_NAME, console.error);
}

onPageParsed();
