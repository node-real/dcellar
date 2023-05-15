const inquirer = require("inquirer");
const { BASE_TYPE, APP_TYPE, PKG_NAMESPACE } = require("../const");

const removePkgNameSpace = (name) => {
  if (name.startsWith(PKG_NAMESPACE + "/")) {
    return name.substr(PKG_NAMESPACE.length + 1);
  } else {
    return name;
  }
};

const questions = [
  {
    type: "list",
    name: "baseType",
    message: "Is it a lib or an app?",
    default: "app",
    choices: [
      {
        name: "App",
        value: BASE_TYPE.app,
      },
      {
        name: "Library",
        value: BASE_TYPE.lib,
      },
    ],
  },
  {
    type: "list",
    name: "appType",
    message: "What type is the app?",
    default: APP_TYPE.nextjs,
    choices: [
      {
        name: "Next.js app",
        value: APP_TYPE.nextjs,
      },
      {
        name: "umi app",
        value: APP_TYPE.admin,
      },
    ],
    when: (answers) => {
      return answers.baseType === BASE_TYPE.app;
    },
  },
  {
    type: "string",
    name: "packageName",
    message: (answers) => {
      return `The name of the new project:`;
    },
    default: (answers) => {
      if (answers.baseType === BASE_TYPE.lib) {
        return `${PKG_NAMESPACE}/my-lib`;
      } else {
        return "my-app";
      }
    },
    validate: (value, answers) => {
      if (answers.baseType === BASE_TYPE.app) {
        const pass = value.match(/^[a-zA-Z0-9\-]+$/);
        return pass ? true : "Name only support [a-zA-Z0-9\\-]";
      } else if (answers.baseType === BASE_TYPE.lib) {
        value = removePkgNameSpace(value);
        const pass = value.match(/^[a-zA-Z0-9\-]+$/);
        return pass ? true : "Invalid package name";
      }
    },
  },
  {
    type: "string",
    name: "projectFolder",
    message: (answers) => {
      return `The path to the project:`;
    },
    default: (answers) => {
      const pkgName = removePkgNameSpace(answers.packageName);
      return `${answers.baseType}/${pkgName}`;
    },
  },
  {
    type: "confirm",
    name: "confirm",
    message: (answers) => {
      return `The setting is:\n ${JSON.stringify(
        answers,
        null,
        2
      )}\nLooks good?`;
    },
    default: true,
  },
];

const getGenOptions = () => {
  return inquirer.prompt(questions).then((answers) => {
    const { confirm, ...rest } = answers;
    if (!confirm) {
      return false;
    } else {
      return rest;
    }
  });
};

module.exports = {
  getGenOptions,
};
