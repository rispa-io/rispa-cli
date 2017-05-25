/* eslint-disable no-console, import/no-dynamic-require, global-require */

const path = require('path')
const fs = require('fs-extra')

const {
  readConfiguration, saveConfiguration,
} = require('./project')
const { handleError } = require('./core')
const { pullRepository } = require('./git')

const PROJECT_PATH = process.cwd()

function updatePlugin(plugin) {
  console.log(`Update plugin with name: ${plugin.name}`)
  pullRepository(plugin.path)
}

async function updatePlugins() {
  const configuration = readConfiguration(PROJECT_PATH)
  if (!configuration || !configuration.plugins || !configuration.pluginsPath) {
    handleError('Can\'t find rispa project config')
  }

  const pluginsPath = path.resolve(PROJECT_PATH, configuration.pluginsPath)

  const plugins = configuration.plugins
    .filter((pluginName, idx, pluginsNames) => pluginsNames.indexOf(pluginName) === idx)
    .map(pluginName => ({
      name: pluginName,
      path: `${pluginsPath}/${pluginName}`,
    }))
    .filter(({ path: pluginPath }) => fs.existsSync(`${pluginPath}/.git`))

  plugins.forEach(updatePlugin)

  configuration.plugins = plugins.map(({ name }) => name)

  saveConfiguration(configuration, PROJECT_PATH)
}

module.exports = updatePlugins
