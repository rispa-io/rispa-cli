const path = require('path')
const fs = require('fs-extra')

const { requireIfExist } = require('./core')

const CONFIGURATION_PATH = './.rispa.json'

const readConfiguration = projectPath => {
  const configurationPath = path.resolve(projectPath, CONFIGURATION_PATH)
  return requireIfExist(configurationPath)
}

const saveConfiguration = (configuration, projectPath) => {
  const configurationPath = path.resolve(projectPath, CONFIGURATION_PATH)
  fs.writeFileSync(configurationPath, JSON.stringify(configuration, null, 2))
}

module.exports = {
  readConfiguration, saveConfiguration,
}
