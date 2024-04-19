const allPkgs = require("./utils/getPkgs");

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", allPkgs],
  },
};
