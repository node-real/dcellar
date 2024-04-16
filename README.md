# DCellar
DCellar is a development management console built on the BNB Greenfield decentralized storage network.

## Features
- [x] Connect using Trust Wallet, Metamask, and WalletConnect
- [x] Off-chain authentication for enhanced security
- [x] Create, delete, and change payment accounts for buckets
- [x] List buckets associated with the account and view details
- [x] Purchase quota for bucket
- [x] List, sort, filter, and search objects within bucket or folder
- [x] Create and delete folder
- [x] Support for selecting multiple files and folders, including drag-and-drop functionality
- [x] Batch upload, delete, and download objects
- [x] Download and preview object
- [x] View folder and object detail
- [x] Manage waiting and uploading list
- [x] Dynamically display uploading files in the object list during the upload process
- [x] Calculate operation fees for each action and validate user account balance before execution
- [x] Set tags for bucket, folder, object, and group
- [x] Create, manage, and delete group
- [x] Share bucket, folder, and object
- [x] Manage shared list
- [x] Transfer tokens between BNB Greenfield and BNB Chain
- [x] Send tokens to other accounts on BNB Greenfield Chain
- [x] Dashboard overview of usage statistics
- [x] View account current month and historical costs
- [x] Create payment Account
- [x] List and filter billing information
- [x] Support for BNB Greenfield enhanced API
- [x] Pricing calculator for cost estimation

## About this Repository

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that holds the source code to multiple projects for Dcellar. It is built using [Rush](http://rushjs.io/).

See [rush.json](./rush.json) for the complete list of packages.

Each package has its own **node_modules** directory that contains symbolic links to _common_ dependencies managed by Rush.

### Projects
|  folders   | Description  |
|  ----  | ----  |
| [/apps/dcellar-web-ui](./apps/dcellar-web-ui) | Storage Console for Developers on BNB Greenfield Network |


## Getting started
To get a local copy up and running, please follow these simple steps.
### Prerequisites
Here is what you need to be able to run Cal.com.

- Node.js (Version: >=18.x)
- @microsoft/rush (Version: >=5.112.x): ```npm install -g @microsoft/rush```
## Development
### Setup
1. Clone the repository:
    ```bash
    git clone git@github.com:node-real/dcellar.git
    ```
2. Go to the project folder
    ```bash
    cd dcellar
    ```
3. Install dependency and build symbolic links for apps:
    ```bash
    rush install & rush build
    ```


### Guides for developing a existed app

Let's take `dcellar-web-ui` as example.
1. Go to the app's directory, and make it will be your working directory.

    ```bash
    cd apps/dcellar-web-ui
    ```

2. Build the internal libs that it dependents

    ```bash
    rush build -T .
    ```

3. Set up your `.env` file
    ```bash
    cp .env.example .env.local
    ```
4. You can run `rushx` command to run scripts in `package.json`.

    ```bash
    rushx dev  # It will run 'dev' script in package.json
    ```

`rushx` is just like `npm run`

Now you can modify things and see the changes.

### Add dependency

**DO NOT** use `npm install`/`yarn install` to update package dependency.

**USE** following commands

```bash
rush add -p react  # It will add react as dependency for your working app

rush add -p @types/react --dev  # It will add @types/react as devDependencies

```

currently, `rush add` command does not support add multiple packages in one line,
so you can manually add `dependency` in `package.json`, then call

```bash
rush update # It will install the dependecy newly added in package.json
```

or you can call `rush add` multiple times

```bash
rush add -p react -s # skip rush update, it will only modify package.json
rush add -p react-dom -s

rush update # after you add packages
```

### Use vscode workspace

It is highly recommended to use vscode workspace, so you can concentrate on the project you are working on as well as you can have an overview of other projects in the monorepo

There is a [monorepo.code-workspace](./monorepo.code-workspace) in the root dir, open it with vscode will automatic set up the workspace.

The vscode plugin [Monorepo Workspace](https://marketplace.visualstudio.com/items?itemName=folke.vscode-monorepo-workspace) is a great tool. You can choose packages you are interested in to show in the workspace to avoid noise.

### Use other editor

If you use editor other than vscode, just make your app's directory as your workspace and use `rush` commands to handle dependency. You can develop as usual.

## Documentation Links
- [Greenfield Whitepaper](https://github.com/bnb-chain/greenfield-whitepaper)
- [Guide to BNB Greenfield](https://docs.bnbchain.org/greenfield-docs/docs/guide/home)
- [Guide to DCellar](https://docs.nodereal.io/docs/dcellar-get-started)
- [Guide to Rush](https://rushjs.io/pages/intro/welcome/)
- [Guide to Apollo](https://github.com/apolloconfig/apollo)
- [BNB Greenfield Release Notes](https://docs.bnbchain.org/greenfield-docs/docs/release-notes/releaseNotes/#greenfield-v023---testnet-maintenance-upgrade-reset)
- [BNB Greenfield RPC Endpoints](https://docs.bnbchain.org/greenfield-docs/docs/api/endpoints/)
- [@bnb-chain/greenfield-js-sdk](https://docs.bnbchain.org/greenfield-js-sdk/)
- [@node-real/uikit](https://node-real.github.io/uikit/#/guides)
- [@node-real/wallketkit](https://node-real.github.io/walletkit/)


## FAQ

### `Cannot find module 'xxx' or its corresponding type declarations.`

To avoid [phantom dependencies](https://rushjs.io/pages/advanced/phantom_deps/), every package that used by `import xx from 'package-name'` should be the dependency of the app.

We can import from `next` even though we do not have a direct `next` dependency before.

After we switched to monorepo, we have to add `next` as dependency in `package.json`, or it will be an error

```bash
$ rush add -p next
```

## Contributing
Please follow our [DCellar Contribution Guide](./CONTRIBUTING.md).


## License
See [LICENSE](./LICENSE) for more information.