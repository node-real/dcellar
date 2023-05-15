module.exports = function removeLineBreak(content) {
  return content.replace(/\s\s+/g, " ");
};
