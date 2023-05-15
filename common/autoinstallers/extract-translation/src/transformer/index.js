const Extractor = require("./Extractor");
const makeVisitor = require("./Visitor");
const parseContent = require("./parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

class Transformer {
  constructor(extractor) {
    this.extractor = extractor;
  }

  processContent(content) {
    const ast = parseContent(content);
    const { visitor, hasChange } = makeVisitor(this.extractor);
    traverse(ast, visitor);
    if (!hasChange()) {
      return content;
    }
    const { code } = generate(ast, {}, content);
    return code;
  }
}

module.exports = Transformer;
