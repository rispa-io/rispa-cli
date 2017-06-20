const path = require('path')
const fs = require('fs-extra')
const { readConfiguration, saveConfiguration } = require('../project')
const { handleError } = require('../core')
const { removeRemote } = require('../git')
const { removeCache: removePluginsCache } = require('../packages')

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

const configurationIsValid = configuration =>
configuration && configuration.plugins && configuration.pluginsPath

const removePlugins = async (...pluginsNames) => {
  const projectPath = process.cwd()
  const configuration = readConfiguration(projectPath)
  if (!configurationIsValid(configuration)) {
    handleError('Can\'t find rispa project config')
  }

  const {
    plugins,
    remotes = {},
    mode,
  } = configuration
  const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)

  const removedPluginsNames = pluginsNames
    .filter(name => plugins.indexOf(name) !== -1)
    .map(name => ({
      name,
      path: `${pluginsPath}/${name}`,
    }))
    .filter(removePlugin)
    .map(({ name }) => name)

  if (mode !== 'dev') {
    removedPluginsNames.forEach(plugin => {
      removeRemote(projectPath, plugin)
    })
  }

  const lastPlugins = plugins.filter(
    pluginName => removedPluginsNames.indexOf(pluginName) === -1
  )

  saveConfiguration(Object.assign({}, configuration, {
    plugins: lastPlugins,
    remotes: lastPlugins.reduce((newRemotes, plugin) => {
      newRemotes[plugin] = remotes[plugin]
      return newRemotes
    }, {}),
  }), projectPath)

  removePluginsCache(projectPath)

  process.exit(1)
}

module.exports = removePlugins
