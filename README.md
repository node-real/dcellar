# Monorepo for Dcellar FE projects

It is the one big repo of DCellar's front-end projects.

## About this Repository

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that holds the source code to multiple DCellar apps. It is built using [Rush](http://rushjs.io/).

See [rush.json](./rush.json) for the complete list of packages.

Each package has its own **node_modules** directory that contains symbolic links to _common_ dependencies managed by Rush.

## Getting started

1. clone the repository: `git clone git@github.com:node-real/dcellar.git`
2. Install the Rush tool as global package: `npm install -g @microsoft/rush`
3. Install dependency and build symbolic links for apps: `rush install`

## Guides for developing existed app

Let's take `dcellar-web-ui` as example

### Prepare

First, you need to cd into the app's directory, and make it will be your workding directory.

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


## FAQ

### `Cannot find module 'xxx' or its corresponding type declarations.`

To avoid [phantom dependencies](https://rushjs.io/pages/advanced/phantom_deps/), every package that used by `import xx from 'package-name'` should be the dependency of the app.

We can import from `next` even though we do not have a direct `next` dependency before.

After we switched to monorepo, we have to add `next` as dependency in `package.json`, or it will be an error

```shell
$ rush add -p next
```

