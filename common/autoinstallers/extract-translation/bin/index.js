const path = require("path");
const meow = require("meow");
const convertFileUnderDir = require("../src/convert");
const DEFAULT_OPTIONS = require("../src/options/defaultOptions");
const isGitClean = require("is-git-clean");
const chalk = require("chalk");
const getCwd = require("../src/utils/getCwd");
const currentDir = getCwd();

const getDir = (inputDir) => {
  if (!inputDir) {
    inputDir = "./src";
  }
  const dir = path.resolve(currentDir, inputDir);
  return dir;
};
const run = async () => {
  const cli = meow({
    description: "Codemods for extracting translation.",
    help: `
        Usage
          $ rush extract-trans
        `,
  });
  const isClean = await isGitClean(currentDir);
  if (!isClean) {
    console.log("Thank you for using extract translation!");
    console.log(
      chalk.yellow(
        "\nBut before we continue, please stash or commit your git changes."
      )
    );
    process.exit(1);
  }

  let inputDir = cli.input[0];

  const dir = getDir(inputDir);
  const options = {
    ...DEFAULT_OPTIONS,
    dir,
  };
  await convertFileUnderDir(options);
};

run();
