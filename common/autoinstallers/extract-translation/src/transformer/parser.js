const parser = require("@babel/parser");

module.exports = function parseCode(code) {
  return parser.parse(code, {
    sourceType: "module",
    plugins: ["jsx", "typescript"],
  });
};
