# DCellar
DCellar is a powerful dapp that allows users to initiate their decentralized data management journey on the Greenfield platform.

## Documentation Links
- [What is BNB Greenfield chain?](https://github.com/bnb-chain/greenfield-whitepaper) - learn about the the mission behind the chain.
- [Guide to BNB Greenfield](https://docs.bnbchain.org/greenfield-docs/docs/guide/home)
- [BNB Greenfield Release Notes](https://docs.bnbchain.org/greenfield-docs/docs/release-notes/releaseNotes/#greenfield-v023---testnet-maintenance-upgrade-reset)
- [BNB Greenfield RPC Endpoints](https://docs.bnbchain.org/greenfield-docs/docs/api/endpoints/) - Find the latest rpc info
- [What is DCellar?](https://docs.nodereal.io/docs/dcellar-get-started) - learn about the usage of DCellar
- [What is Apollo?](https://github.com/apolloconfig/apollo) - A reliable configuration management system.
- [@bnb-chain/greenfield-js-sdk](https://docs.bnbchain.org/greenfield-js-sdk/) - learn about how to interactive with chain or storage provider.
- [@node-real/uikit](https://node-real.github.io/uikit/#/guides) - our recommended UI library.


## About this Repository

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that holds the source code to multiple projects. It is built using [Rush](http://rushjs.io/).

See [rush.json](./rush.json) for the complete list of packages.

Each package has its own **node_modules** directory that contains symbolic links to _common_ dependencies managed by Rush.

## Projects
|  folders   | Description  |
|  ----  | ----  |
| [/apps/dcellar-web-ui](./apps/dcellar-web-ui) | Storage Console for Developers on BNB Greenfield Network |


## Getting started

1. clone the repository: `git clone git@github.com:node-real/dcellar-fe.git`
2. Install the Rush tool as global package: `npm install -g @microsoft/rush`
3. Install dependency and build symbolic links for apps: `rush install`


## Guides for developing a existed app

Let's take `dcellar-web-ui` as example

### Prepare

First, you need to cd into the app's directory, and make it will be your working directory.

```shell
$ cd apps/dcellar-web-ui
```

Then, build the internal libs that it dependents

```shell
$ rush build -T .
```

### Start the project

You can run `rushx` command to run scripts in `package.json`.

```shell
$ rushx dev  # It will run 'dev' script in package.json
```

`rushx` is just like `npm run`

Now you can modify things and see the changes.



### Add dependency

**DO NOT** use `npm install`/`yarn install` to update package dependency.

**USE** following commands

```shell
$ rush add -p react  # It will add react as dependency for your working app

$ rush add -p @types/react --dev  # It will add @types/react as devDependencies

```

currently, `rush add` command does not support add multiple packages in one line,
so you can manually add `dependency` in `package.json`, then call

```shell
$ rush update # It will install the dependecy newly added in package.json
```

or you can call `rush add` multiple times

```shell
$ rush add -p react -s # skip rush update, it will only modify package.json
$ rush add -p react-dom -s

$ rush update # after you add packages
```

### Use vscode workspace

It is highly recommended to use vscode workspace, so you can concentrate on the project you are working on as well as you can have an overview of other projects in the monorepo

There is a [monorepo.code-workspace](./monorepo.code-workspace) in the root dir, open it with vscode will automatic set up the workspace.

The vscode plugin [Monorepo Workspace](https://marketplace.visualstudio.com/items?itemName=folke.vscode-monorepo-workspace) is a great tool. You can choose packages you are interested in to show in the workspace to avoid noise.

### Use other editor

If you use editor other than vscode, just make your app's directory as your workspace and use `rush` commands to handle dependency. You can develop as usual.

## Managing Environment Variables
We use [Next.js environment variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables), specifically the `NEXT_PUBLIC_ENV` variable, to differentiate between environments. This approach also applies to variables that do not change frequently, which can be stored here as well. For more volatile environment data and alert notifications, we manage them through [`Apollo`](https://www.apolloconfig.com/#/). However, if you prefer not to use Apollo, you can entirely rely on Next.js environment variables for management.

If you decide against using Apollo, you can remove all Apollo configuration code. Additionally, places in the code that previously referenced Apollo variables should be updated to use Next.js environment variables instead.


## FAQ

### `Cannot find module 'xxx' or its corresponding type declarations.`

To avoid [phantom dependencies](https://rushjs.io/pages/advanced/phantom_deps/), every package that used by `import xx from 'package-name'` should be the dependency of the app.

We can import from `next` even though we do not have a direct `next` dependency before.

After we switched to monorepo, we have to add `next` as dependency in `package.json`, or it will be an error

```shell
$ rush add -p next
```

## Contributing
Please follow our [DCellar Contribution Guide](./CONTRIBUTING.md).


## License
See [LICENSE](./LICENSE) for more information.