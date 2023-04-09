import { PactCommand } from "@kadena/client";
import { isKAccount } from "@kcf/kda-wallet-base";
import { ChainweaverWallet } from "@kcf/kda-wallet-chainweaver";
import { EckoWallet } from "@kcf/kda-wallet-eckowallet";
import { ZelcoreWallet } from "@kcf/kda-wallet-zelcore";
/**
 * https://github.com/mapbox/mapbox-gl-geocoder/issues/441
 * `events` npm package must be installed
 * else Web3Modal will throw
 * `events_1.EventEmitter is not a constructor`
 *
 */
import { Web3Modal } from "@web3modal/standalone";
import axios from "axios";
import { mkChainKey, WalletConnectWallet } from "@kcf/kda-wallet-walletconnect";

/** @type {?import("@kcf/kda-wallet-base").KdaWallet} */
let CONNECTED_WALLET = null;

const NETWORK_ID = "testnet04";
const CHAIN_ID = "1";
const TTL_S = 600;
const GAS_LIMIT = 2500;
const GAS_PRICE = 1e-7;

const CHAINWEB_LOCAL_ENDPOINT = `https://api.testnet.chainweb.com/chainweb/0.0/${NETWORK_ID}/chain/${CHAIN_ID}/pact/api/v1/local`;

/** kadena coin flip reborn project ID */
const WALLETCONNECT_PROJECT_ID = "67ce47db9e4c2585385be3581ee3cb9d";

const WALLETCONNECT_SIGN_CLIENT_OPTIONS = {
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata: {
    name: "Example Kadena Wallet Adapter App",
    description: "A simple webapp for testing kadena wallets",
    url: "http://localhost",
    icons: [
      "https://altcoinsbox.com/wp-content/uploads/2023/01/kadena-logo-300x300.webp",
    ],
  },
};

const WEB3_MODAL = new Web3Modal({
  projectId: WALLETCONNECT_PROJECT_ID,
  walletConnectVersion: 2,
  standaloneChains: [mkChainKey(NETWORK_ID)],
});

const ALL_WALLETS = /** @type {const} */ ([
  "chainweaver",
  "eckoWALLET",
  "WalletConnect",
  "Zelcore",
]);

/** @typedef {typeof ALL_WALLETS[number]} WalletKey */

/**
 * @type {Record<WalletKey, typeof import("@kcf/kda-wallet-base").KdaWallet>}
 */
const WALLET_TO_CLASS = {
  chainweaver: ChainweaverWallet,
  eckoWALLET: EckoWallet,
  WalletConnect: WalletConnectWallet,
  Zelcore: ZelcoreWallet,
};

/**
 * Defaults to Class.connect({}) if not specified
 * @type {Record<WalletKey, () => Promise<import("@kcf/kda-wallet-base").KdaWallet>>}
 */
const WALLET_TO_CONNECT_PROCEDURE = {
  chainweaver: connectChainweaverViaDialog,
  eckoWALLET: () => EckoWallet.connect({ networkId: NETWORK_ID }),
  WalletConnect: () =>
    WalletConnectWallet.connect({
      signClientOptions: WALLETCONNECT_SIGN_CLIENT_OPTIONS,
      walletConnectModalController: WEB3_MODAL,
      networkId: NETWORK_ID,
      // establish a new session every time
      pairingTopic: undefined,
    }),
  Zelcore: ZelcoreWallet.connect,
};

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
    try {
      const wallet = await connectFn();
      CONNECTED_WALLET = wallet;
      onConnectedWalletChanged();
    } catch (e) {
      alert(e.message);
    }
  };
  cls.isInstalled().then((isInstalled) => {
    if (!isInstalled) {
      button.disabled = true;
    }
  });
  return button;
}

function createAllConnectWalletButtons() {
  const connectWalletButtons = ALL_WALLETS.map(createConnectWalletButton);
  /** @type {HTMLDivElement} */
  // @ts-ignore
  const section = document.getElementById("wallet-select-section");
  section.append(...connectWalletButtons);
}

async function disconnectWallet() {
  if (!CONNECTED_WALLET) {
    alert("no wallet connected");
    return;
  }
  await CONNECTED_WALLET.disconnect();
  CONNECTED_WALLET = null;
  onConnectedWalletChanged();
}

function setupDisconnectWalletButton() {
  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const btn = document.getElementById("disconnect-button");
  btn.onclick = disconnectWallet;
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
  createAllConnectWalletButtons();
  setupDisconnectWalletButton();
  setupTransferForm();

  onConnectedWalletChanged();
}

onPageParsed();
