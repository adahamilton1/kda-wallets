import { TEMPLATE } from "./template";

/**
 * A ready-to-use "connect wallet" dialog containing "connect wallet" buttons for
 * each @kcf/kda-wallet-* wallet adapter.
 *
 * This class exposes the connected wallet through its `connectedWallet` property
 */
export class KdaWalletConnectDialog extends HTMLElement {
  /** @returns {?import("@kcf/kda-wallet-base").KdaWallet} */
  // eslint-disable-next-line class-methods-use-this
  get connectedWallet() {
    // TODO
    return null;
  }

  /** @returns {HTMLDialogElement} */
  get dialog() {
    // @ts-ignore
    return this.firstElementChild;
  }

  /** @returns {HTMLDivElement} */
  get container() {
    // @ts-ignore
    return this.querySelector("section");
  }

  /** @returns {HTMLDivElement} */
  get header() {
    // @ts-ignore
    return this.container.querySelector("header");
  }

  /** @returns {HTMLButtonElement} */
  get closeButton() {
    // @ts-ignore
    return this.header.querySelector("button");
  }

  /** @returns {boolean} */
  get open() {
    return this.dialog.open;
  }

  constructor() {
    super();

    // convert html string to document fragment
    const oldInnerHtml = this.innerHTML;
    const temporaryTemplate = document.createElement("template");
    temporaryTemplate.innerHTML = oldInnerHtml;

    this.innerHTML = TEMPLATE;
    this.container.appendChild(temporaryTemplate.content);

    // attach listeners in ctor, not connectedCallback
    // since we dont want to reattach them everytime this elem moves

    this.closeButton.onclick = this.close.bind(this);
  }

  showModal() {
    return this.dialog.showModal();
  }

  show() {
    return this.dialog.show();
  }

  close() {
    return this.dialog.close();
  }
}
