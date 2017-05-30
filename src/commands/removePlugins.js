const path = require('path')
const fs = require('fs-extra')

const {
  readConfiguration, saveConfiguration,
} = require('../project')
const { handleError } = require('../core')

const PROJECT_PATH = process.cwd()

const removePlugin = plugin => {
  try {
    fs.removeSync(plugin.path)
    console.log(`Remove plugin with name: ${plugin.name}`)
    return true
  } catch ({ message }) {
    console.log(`Can't remove plugin with name: ${plugin.name}`, message)
    return false
  }
}

const removePlugins = async (...pluginsNames) => {
  const configuration = readConfiguration(PROJECT_PATH)
  if (!configuration || !configuration.plugins || !configuration.pluginsPath) {
    handleError('Can\'t find rispa project config')
  }

  const installedPlugins = configuration.plugins

  const pluginsPath = path.resolve(PROJECT_PATH, configuration.pluginsPath)

  const removedPluginsNames = pluginsNames
    .filter(name => installedPlugins.indexOf(name) !== -1)
    .map(name => ({
      name,
      path: `${pluginsPath}/${name}`,
    }))
    .filter(removePlugin)
    .map(({ name }) => name)

  configuration.plugins = installedPlugins.filter(pluginName => removedPluginsNames.indexOf(pluginName) === -1)

  saveConfiguration(configuration, PROJECT_PATH)

  process.exit(1)
}

module.exports = removePlugins
