const checkIsEmail = require("../utils/checkIsEmail");
const checkIsNumber = require("../utils/checkIsNumber");
const checkIsSpecialChar = require("../utils/checkIsSpecialChar");

const filterPath = (path) => {
  console.log(path);
  /**
   * terms/index is Agreement term, which not works well
   */
  if (path.includes("terms/index")) {
    return false;
  }
  if (!path.endsWith(".tsx")) {
    return false;
  }
  return true;
};

const reserveContent = (content) => {
  const isPureNumber = checkIsNumber(content);
  if (isPureNumber) {
    return true;
  }
  const isEmail = checkIsEmail(content);
  if (isEmail) {
    return true;
  }
  const isSpecialChar = checkIsSpecialChar(content);
  if (isSpecialChar) {
    return true;
  }
  return false;
};

const devLang = "en";

const localeDir = "locales";

const DEFAULT_OPTIONS = {
  filterPath,
  reserveContent,
  devLang,
  localeDir,
};

module.exports = DEFAULT_OPTIONS;
