const { buildContext } = require("./buildContext");
const { getGenOptions } = require("./prompt");
const Generator = require("./generator");

const main = async () => {
  const options = await getGenOptions();
  if (!options) {
    return;
  }
  const context = await buildContext(options);
  const generator = new Generator(context);
  await generator.gen();
};

main();
