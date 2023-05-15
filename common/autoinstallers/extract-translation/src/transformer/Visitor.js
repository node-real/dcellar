const t = require("@babel/types");
const removeLineBreak = require("../utils/removeLineBreak");

const makeVisitor = (extractor) => {
  const { options } = extractor;
  const { reserveContent } = options;
  let flag = false;
  const visitor = {
    JSXText(path) {
      const rawValue = path.node.value;
      let value = rawValue.trim();
      if (!value) {
        return;
      }
      value = removeLineBreak(value);
      if (reserveContent && reserveContent(value)) {
        return;
      }
      flag = true;
      const key = extractor.tryGetKeyByValue(value);
      const expr = t.jSXExpressionContainer(
        t.callExpression(t.identifier("t"), [t.stringLiteral(key)])
      );
      path.replaceWith(expr);
    },
  };
  return {
    visitor,
    hasChange: () => flag,
  };
};

module.exports = makeVisitor;
