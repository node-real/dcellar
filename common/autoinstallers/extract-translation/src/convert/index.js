const klawSync = require("klaw-sync");
const path = require("path");
const fs = require("fs");
const Transformer = require("../transformer");
const Extractor = require("../transformer/Extractor");
const formatCode = require("../utils/formatCode");

async function convertFileUnderDir(options) {
  const { dir, filterPath = (path) => true } = options;
  const paths = klawSync(dir, {
    nodir: true,
    filter: (item) => {
      if (item.stats.isDirectory()) {
        if (item.path.includes("node_modules")) {
          return false;
        } else {
          return true;
        }
      } else {
        return filterPath(item.path);
      }
    },
  });

  const extractor = new Extractor(options);
  const transformer = new Transformer(extractor);
  extractor.loadLocaleFile();
  for (const { path } of paths) {
    const fileContent = fs.readFileSync(path, {
      encoding: "utf8",
    });
    let transformedCode = transformer.processContent(fileContent);
    if (transformedCode === fileContent) {
      continue;
    }
    transformedCode = formatCode(transformedCode);
    extractor.writeLocaleFile();
    fs.writeFileSync(path, transformedCode, {
      encoding: "utf-8",
    });
  }
}

module.exports = convertFileUnderDir;
