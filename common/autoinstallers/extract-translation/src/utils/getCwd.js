module.exports = function getCwd() {
  const rushInvokedFolder = process.env["RUSH_INVOKED_FOLDER"];
  if (rushInvokedFolder) {
    return rushInvokedFolder;
  } else {
    return process.cwd();
  }
};
