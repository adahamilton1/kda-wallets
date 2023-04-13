// need additional section container within dialog because
// you cant set display: property of dialog or it'll show

export const TEMPLATE = `
  <button type="button">
    Chainweaver
  </button>
  <dialog>
    <section>
      <header style="display: flex; align-items: center; gap: 1em;">
        <h6>Connect Chainweaver</h6>
        <button aria-label="close" type="button" style="background:none; border:none; cursor:pointer;">
          x
        </button>
      </header>
      <form>
        <label>
          <p>Paste your 'k:' wallet address here:</p>
          <input type="text" name="address"></input>
        </label>
        <button type="submit">Connect</button>
      </form>
    </section>
  </dialog>
`;