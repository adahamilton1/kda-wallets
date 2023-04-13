// need additional section container within dialog because
// you cant set display: property of dialog or it'll show

export const TEMPLATE = `
  <dialog>
    <section>
      <header>
        <h6>Connect Wallet</h6>
        <button aria-label="close" type="button">
          x
        </button>
      </header>
      <!-- children appended here -->
    </section>
  </dialog>
`;
