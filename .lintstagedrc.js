module.exports = {
  // NB: html-eslint's style changes (self-closing -> void tag, tab-size 4) will be overwritten by prettier
  "*.{css,json,md}": "pnpm prettier --write",
  "*.html": ["pnpm eslint --fix", "pnpm prettier --write"],
  "*.js": ["pnpm eslint --fix", "pnpm prettier --write"],
};
