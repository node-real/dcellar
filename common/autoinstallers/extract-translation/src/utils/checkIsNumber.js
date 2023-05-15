const regex = /^[+-]?([0-9]*[.])?[0-9]+$/;

module.exports = function checkIsNumber(content) {
  return regex.test(content);
};
