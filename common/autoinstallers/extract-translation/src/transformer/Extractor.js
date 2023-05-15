const path = require("path");
const fsExtra = require("fs-extra");
const fs = require("fs");
const _ = require("lodash");
const getCwd = require("../utils/getCwd");
const getRandomId = () => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + 7);
};

class Extractor {
  constructor(options) {
    this.options = options;
    const { localeDir, devLang } = options;
    this.valueKeyMap = {};
    this.keys = new Set();
    this.localeFilePath = path.join(getCwd(), localeDir, `${devLang}.json`);
  }

  // TODO Semantics
  _getNewLabelKey() {
    while (true) {
      const randomId = getRandomId();
      const key = `label_${randomId}`;
      if (this.keys.has(key)) {
        continue;
      }
      this.keys.add(key);
      return key;
    }
  }

  tryGetKeyByValue(value) {
    if (!this.valueKeyMap[value]) {
      this.valueKeyMap[value] = this._getNewLabelKey();
    }
    return this.valueKeyMap[value];
  }

  loadLocaleFile() {
    try {
      const content = fs.readFileSync(this.localeFilePath, {
        encoding: "utf8",
      });
      const values = JSON.parse(content);
      for (const key in values) {
        if (Object.hasOwnProperty.call(values, key)) {
          const value = values[key];
          this.valueKeyMap[value] = key;
          this.keys.add(key);
        }
      }
    } catch (err) {
      console.log("No local file found");
    }
  }
  writeLocaleFile() {
    fsExtra.ensureFileSync(this.localeFilePath);
    const fileContent = JSON.stringify(_.invert(this.valueKeyMap), null, 2);
    fs.writeFileSync(this.localeFilePath, fileContent, {
      encoding: "utf8",
    });
  }
}

module.exports = Extractor;
