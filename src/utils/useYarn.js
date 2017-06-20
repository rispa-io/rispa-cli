const fs = require('fs-extra')
const path = require('path')

const checkUseYarn = projectPath => fs.existsSync(path.resolve(projectPath, './yarn.lock'))

const checkUseYarnLerna = projectPath => {
  const lernaJson = fs.readJsonSync(path.resolve(projectPath, './lerna.json'), { throws: false })
  return lernaJson && lernaJson.npmClient === 'yarn'
}

module.exports = {
  checkUseYarn,
  checkUseYarnLerna,
}
