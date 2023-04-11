import { defineCustomElement as defineConnectDialog } from "@kcf/kda-wallet-connect-dialog";

/** @return {import("@kcf/kda-wallet-connect-dialog").KdaWalletConnectDialog} */
function getConnectDialog() {
  // @ts-ignore
  return document.querySelector("kda-wallet-connect-dialog");
}

function setupConnectWalletButton() {
  /** @type {HTMLButtonElement} */
  // @ts-ignore
  const btn = document.getElementById("connect-wallet-button");
  btn.onclick = () => {
    getConnectDialog().showModal();
  };
}

function onPageParsed() {
  // web components define
  defineConnectDialog();

  setupConnectWalletButton();
}

onPageParsed();
