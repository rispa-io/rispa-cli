const path = require('path')
const fs = require('fs-extra')
const { CONFIGURATION_PATH } = require('../constants')

const performProjectName = projectName => (
  projectName.replace(/\s+/g, '-')
)

const createDefaultConfiguration = mode => ({
  mode,
  pluginsPath: './packages',
  plugins: [],
  remotes: {},
})

const readConfiguration = projectPath => {
  const configurationPath = path.resolve(projectPath, CONFIGURATION_PATH)
  return fs.readJsonSync(configurationPath, { throws: false })
}

const saveConfiguration = (configuration, projectPath) => {
  const configurationPath = path.resolve(projectPath, CONFIGURATION_PATH)
  fs.writeFileSync(configurationPath, JSON.stringify(configuration, null, 2))
}

module.exports = {
  performProjectName,
  createDefaultConfiguration,
  readConfiguration,
  saveConfiguration,
}
