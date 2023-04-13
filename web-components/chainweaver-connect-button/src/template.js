export const TEMPLATE = `
  <button type="button">
    Chainweaver
  </button>
`;

// need additional section container within dialog because
// you cant set display: property of dialog or it'll show
export const DIALOG_INNER_HTML = `
  <section>
    <header>
      <h6>Connect Chainweaver</h6>
      <button aria-label="close" type="button">
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
`;
