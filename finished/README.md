# MetaMask Test Dapp

This is a simple test dapp for use in MetaMask e2e tests and manual QA.

Currently hosted [here](https://metamask.github.io/test-dapp/).

## Usage

If you wish to use this dapp in your e2e tests, install this package and set up a script of e.g. the following form:

```shell
static-server node_modules/@metamask/test-dapp/dist --port 9011
```

## Development

### Requires Manual Deployment

After merging or pushing to `master`, please run `yarn deploy` in the package root directory if the contents of the `dist/` directory have changed.

### Elements Must Be Selectable by XPath

Consider that elements must be selectable by XPath. This means that appearances can be misleading.
For example, consider this old bug:

```html
              <button class="btn btn-primary btn-lg btn-block mb-3" id="approveTokensWithoutGas" disabled>Approve Tokens
                Without Gas</button>
```

This appears on the page as `Approve Tokens Without Gas`. In reality, the value included the whitespace on the second line, and caused XPath queries for the intended value to fail:

```html
Approve Tokens                Without Gas
```

### Run Inheritance DApp

Run harthat node
```shell
npm run hardhat:node
```
Deploy Wallet contract and run web app
```shell
npm run start:with:wallet:deploy
```
Import harthat default Account #0 and Account #1 private keys into MetaMask
```shell
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```
Start using the DApp
