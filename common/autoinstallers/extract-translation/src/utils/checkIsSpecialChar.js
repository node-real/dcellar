/**
 * Check content only has non-alphabet characters
 * @param {string} content
 * @returns {boolean}
 */
module.exports = function checkIsSpecialChar(content) {
  return /^[^a-zA-Z]+$/.test(content);
};
