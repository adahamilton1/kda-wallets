// need additional section container within dialog because
// you cant set display: property of dialog or it'll show

export const TEMPLATE = `
  <dialog>
    <section>
      <header style="display: flex; align-items: center; gap: 1em;">
        <h6>Connect Wallet</h6>
        <button aria-label="close" type="button" style="background:none; border:none; cursor:pointer;">
          x
        </button>
      </header>
      <!-- children appended here -->
    </section>
  </dialog>
`;
