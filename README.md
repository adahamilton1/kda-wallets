# @kcf/kda-wallet

A universal wallet adapter for kadena wallets built upon [kadena.js](https://github.com/kadena-community/kadena.js)

## Table of contents

- [Table of contents](#table-of-contents)
- [Objective](#objective)
- [Usage](#usage)
- [Repo Structure](#repo-structure)
  - [Base Packages](#base-packages)
  - [Web Components](#web-components)
- [FAQ](#faq)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Donations](#donations)

## Objective

To create a simple, minimal common interface across all kadena wallets for easy dapp integration.

## Usage

### Base Packages

- `@kcf/kda-wallet-base` contains the base `KdaWallet` abstract base class.
- All individual wallet packages `@kcf/kda-wallet-<wallet-name>` implement this class
- Dapps can now use the common `KdaWallet` type and its interfaces for common functionality such as signing transactions.

See `examples/minimal-example` folder for a minimal dapp using this library.

### Web Components

The web-components folder contains ready-to-use custom elements that can be dropped in to an existing frontend project.

See `examples/web-components-example` folder for a minimal dapp using these custom elements or the READMEs of each individual package for detailed documentation.

## Repo Structure

```
├── base /* @kcf/kda-wallet-base package containing the base KdaWallet abstract base class and common util functions */
├── examples
|   ├── minimal-example /* a simple webapp demonstrating all implemented wallets */
|   ├── web-components-example /* a simple webapp using the implemented web-components */
|
├── wallets
|   ├── chainweaver /* @kcf/kda-wallet-chainweaver */
|   ├── ... /* each subdirectory is a npm package implementing the abstract base class for a specific wallet */
|
└── web-components
    ├── connect-dialog /* @kcf/kda-wallet-web-components-base */
    ├── connect-dialog /* @kcf/kda-wallet-connect-dialog */
    ├── chainweaver /* @kcf/kda-wallet-chainweaver-connect-button */
    ├── ... /* each subdirectory is a npm package implementing a connect wallet web-component button */
```

## FAQ

### Many wallets do not implement quicksign. Why is `quickSignCmds()` part of the base class if it's not available most of the time?

While quicksign is not implemented in many wallets yet 😔, it seems like most wallets do intend to support it at some point in the future, which is why we decided to include it as part of the base class instead of splitting that out into its own interface. To see which wallets do not implement quicksign, please check the individual wallet packages' README.

### How did you get around each wallet having its own quirks in initialization?

We didn't 😱. This is why the args passed to `KdaWallet.connect()` is different for each wallet as each wallet requires a different set of data for initialization. To see the type of initialization data required for each wallet, please check the individual wallet packages' README or the example app.

### Is this library typescript compatible?

The library is written in js with jsdoc typedefs and distributed directly as src. This should mean that you will get the type information when using it in typescript projects as well.

## Documentation

`pnpm typedoc` to generate typedocs locally.

## Contributing

Any and all contributions are welcome, from documentation to new wallet integrations. Please feel free to open a Github issue!

## Donations

If you love this project and wish to support us, please send any donations to `k:316a8c9d4f39a4566cf8b273473629dc381bee25f396ed5795d5e5aad2463e1b`. Thank you! 🥰
