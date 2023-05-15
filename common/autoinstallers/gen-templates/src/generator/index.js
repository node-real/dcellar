const {
  makeDirRecursive,
  walkDir,
  getDirPath,
  projectRootDir,
} = require("../utils/fs");
const { readFileSync, writeFileSync } = require("fs");
const { PKG_NAMESPACE } = require("../const");
const path = require("path");
const JSONC = require("jsonc-parser");
const sorter = (a, b) => {
  const isAHasNamespace = a.startsWith(PKG_NAMESPACE);
  const isBHasNamesapce = b.startsWith(PKG_NAMESPACE);
  if (isAHasNamespace && !isBHasNamesapce) {
    return 1;
  } else if (!isAHasNamespace && isBHasNamesapce) {
    return -1;
  }
  if (a === b) {
    return 0;
  }
  return a > b ? 1 : -1;
};
class Generator {
  constructor(context) {
    this.context = context;
  }

  async gen() {
    this._makeDir();
    await this._copyFromTemplate();
    this._addToRushJSON();
  }

  _addToRushJSON() {
    const rushJSONPath = path.join(projectRootDir, "rush.json");
    const content = readFileSync(rushJSONPath, {
      encoding: "utf-8",
    });
    const config = JSONC.parse(content);
    config.projects.push({
      packageName: this.context.packageName,
      projectFolder: this.context.projectFolder,
    });
    config.projects.sort((pkgA, pkgB) =>
      sorter(pkgA.packageName, pkgB.packageName)
    );
    writeFileSync(rushJSONPath, JSON.stringify(config, null, 2), {
      encoding: "utf-8",
    });
  }

  async _copyFromTemplate() {
    const { realTemplateDirPath, realFolderPath } = this.context;
    const files = walkDir(realTemplateDirPath);
    for (const templateFile of files) {
      const relativePath = path.relative(realTemplateDirPath, templateFile);
      const targetFilePath = path.join(realFolderPath, relativePath);
      this._copyForFile(templateFile, targetFilePath);
    }
  }

  _copyForFile(sourcePath, targetPath) {
    makeDirRecursive(getDirPath(targetPath)); // make target dir
    const originContent = readFileSync(sourcePath, {
      encoding: "utf-8",
    });
    const newContent = this._replaceContent(originContent);
    writeFileSync(targetPath, newContent, {
      encoding: "utf-8",
      flag: "w+",
    });
  }

  _replaceContent(content) {
    return content.replace(/PLACEHOLDER_(\w+)_PLACEHOLDER/g, (match, p1) => {
      const val = this.context[p1];
      return val;
    });
  }

  _makeDir() {
    makeDirRecursive(this.context.realFolderPath);
  }
}

module.exports = Generator;
