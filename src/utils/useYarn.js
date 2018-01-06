const fs = require('fs-extra')
const path = require('path')
const { YARN_LOCK_PATH, LERNA_JSON_PATH } = require('../constants')

const checkUseYarn = projectPath => fs.existsSync(path.resolve(projectPath, YARN_LOCK_PATH))

const checkUseYarnLerna = projectPath => {
  const lernaJson = fs.readJsonSync(path.resolve(projectPath, LERNA_JSON_PATH), { throws: false })
  return !lernaJson || (lernaJson.npmClient === 'yarn')
}

module.exports = {
  checkUseYarn,
  checkUseYarnLerna,
}
