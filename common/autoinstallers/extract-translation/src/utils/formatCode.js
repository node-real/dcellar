const prettier = require("prettier");

module.exports = function formatCode(content) {
  return prettier.format(content, {
    parser: "typescript",
    arrowParens: "always",
    printWidth: 100,
    proseWrap: "always",
    semi: true,
    singleQuote: true,
    trailingComma: "all",
    tabWidth: 2,
  });
};
