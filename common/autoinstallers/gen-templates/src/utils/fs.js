const path = require("path");
const fs = require("fs");
const projectRootDir = path.resolve(__dirname, "../../../../../");
const templatesRootDir = path.resolve(__dirname, "../..", "templates");
module.exports.projectRootDir = projectRootDir;
module.exports.templatesRootDir = templatesRootDir;

module.exports.makeDirRecursive = (dirPath) => {
  if (!dirPath) {
    return;
  }
  fs.mkdirSync(dirPath, {
    recursive: true,
  });
};

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  for (let file of list) {
    file = dir + "/" + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(file));
    } else {
      /* Is a file */
      results.push(file);
    }
  }
  return results;
};

module.exports.walkDir = walk;

module.exports.getDirPath = (fileName) => {
  const pathArr = fileName.split(path.sep);
  if (pathArr.length === 1) {
    return "";
  }
  pathArr.pop();
  return path.join("/", ...pathArr);
};
