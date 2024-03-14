# DCellar Contribution Guide
Thanks for your interest in contributing to DCellar! Please take a moment to review this document before submitting a pull request.

## Prerequisites
This project relies on [`nodejs`](https://nodejs.org/en), and use [`rushjs`](https://rushjs.io/) as a monorepo manager, make sure you have them installed:
- [`nodejs`](https://nodejs.org/en) v20 or higher
- [`rushjs`](https://rushjs.io/)  v5.112.1


## Getting started for developing existed app
First simply clone the repository, enter the directory and install packages:
```
git clone https://github.com/node-real/dcellar.git
cd dcellar
rush install
```
then, let's take `dcellar-web-ui` as example

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


## Reporting a bug

Just submit an issue though [github issue page](https://github.com/node-real/dcellar/issues).
Besides, before committing, git hook will automatically run eslint to check and fix errors.