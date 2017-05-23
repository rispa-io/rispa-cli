/* eslint-disable no-console, import/no-dynamic-require, global-require */

const path = require('path')
const { prompt } = require('inquirer')

const { handleError } = require('./core')
const {
  readConfiguration,
  saveConfiguration,
 } = require('./project')
const githubApi = require('./githubApi')
const { installPlugins } = require('./plugin')

const PROJECT_PATH = process.cwd()

function selectPlugins(plugins) {
  return prompt([{
    type: 'checkbox',
    message: 'Select install plugins:',
    name: 'installPluginsNames',
    choices: plugins,
  }])
}

function findPluginsForInstall(plugins, installedPluginsNames) {
  const pluginsForChoice = plugins.filter(({ name }) => installedPluginsNames.indexOf(name) === -1)
  if (pluginsForChoice.length === 0) {
    handleError('Can\'t find plugins for install')
  }

  return selectPlugins(pluginsForChoice)
}

async function addPlugin(...pluginsNames) {
  const configuration = readConfiguration(PROJECT_PATH)
  if (!configuration) {
    handleError('Can\'t find rispa project config')
  }

  const {
    plugins: installedPluginsNames = [],
    pluginsPath = './packages',
  } = configuration

  const { data: { items: plugins } } = await githubApi.plugins()

  if (pluginsNames.length === 0) {
    const { installPluginsNames } = await findPluginsForInstall(plugins, installedPluginsNames)

    pluginsNames.push(...installPluginsNames)
  } else {
    const notValidPluginsNames = pluginsNames.filter(pluginName => !plugins.some(({ name }) => name === pluginName))
    if (notValidPluginsNames.length > 0) {
      handleError(`Can't find plugins with names:\n - ${notValidPluginsNames.join(', ')}`)
    }
  }

  installPlugins(pluginsNames, plugins, installedPluginsNames, path.resolve(PROJECT_PATH, pluginsPath))

  configuration.plugins = configuration.plugins.concat(pluginsNames)

  saveConfiguration(configuration, PROJECT_PATH)

  process.exit(1)
}

module.exports = addPlugin
