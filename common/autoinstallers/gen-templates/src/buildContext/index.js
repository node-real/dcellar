const path = require("path");
const { BASE_TYPE, APP_TYPE } = require("../const");
const { projectRootDir, templatesRootDir } = require("../utils/fs");

const decideTemplateDir = (options) => {
  const { baseType, appType } = options;
  if (baseType === BASE_TYPE.lib) {
    return "lib-template";
  }
  if (baseType === BASE_TYPE.app) {
    switch (appType) {
      case APP_TYPE.nextjs:
        return "app-next-template";
      case APP_TYPE.admin:
        return "admin-template";
    }
  }
  throw Error("unknow app type or base type");
};

module.exports.buildContext = async (options) => {
  const realFolderPath = path.join(projectRootDir, options.projectFolder);
  const relativePathToRoot = path.relative(realFolderPath, projectRootDir);
  const templateDir = decideTemplateDir(options);
  const realTemplateDirPath = path.join(templatesRootDir, templateDir);

  return {
    ...options,
    realFolderPath,
    relativePathToRoot,
    realTemplateDirPath,
  };
};
