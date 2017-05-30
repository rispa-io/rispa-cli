const path = require('path')
const { prompt } = require('inquirer')

const { handleError } = require('../core')
const {
  readConfiguration,
  saveConfiguration,
 } = require('../project')
const githubApi = require('../githubApi')
const { installPlugins } = require('../plugin')

const extractPluginNameFromUrl = cloneUrl => {
  const parts = cloneUrl.split('/')
  return parts[parts.length - 1].replace(/\.git$/, '')
}

const extractCloneUrl = pluginName => (
  pluginName && pluginName.startsWith('git:') ?
    pluginName.replace(/^git:/, '') : null
)

const selectPlugins = plugins => prompt([{
  type: 'checkbox',
  message: 'Select install plugins:',
  name: 'installPluginsNames',
  choices: plugins,
}])

const findPluginsForInstall = (plugins, installedPluginsNames) => {
  const pluginsForChoice = plugins.filter(({ name }) => installedPluginsNames.indexOf(name) === -1)
  if (pluginsForChoice.length === 0) {
    handleError('Can\'t find plugins for install')
  }

  return selectPlugins(pluginsForChoice)
}

const addPluginsByUrl = (clonePluginUrl, installedPluginsNames, pluginsPath) => {
  if (!clonePluginUrl.endsWith('.git')) {
    handleError(`Invalid plugin git url: ${clonePluginUrl}`)
  }

  const pluginInfo = {
    name: extractPluginNameFromUrl(clonePluginUrl),
    clone_url: clonePluginUrl,
  }

  return installPlugins([pluginInfo.name], [pluginInfo], installedPluginsNames, pluginsPath)
}

const addOfficialPlugins = async (pluginsNames, installedPluginsNames, pluginsPath) => {
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

  return installPlugins(pluginsNames, plugins, installedPluginsNames, pluginsPath)
}

const addPlugins = async (...pluginsNames) => {
  const projectPath = process.cwd()
  const configuration = readConfiguration(projectPath)
  const resolve = relPath => path.resolve(projectPath, relPath)

  if (!configuration) {
    handleError('Can\'t find rispa project config')
  }

  const {
    plugins: installedPluginsNames = [],
    pluginsPath: relPluginsPath = './packages',
  } = configuration
  const pluginsPath = resolve(relPluginsPath)

  const clonePluginUrl = extractCloneUrl(pluginsNames[0])
  if (clonePluginUrl) {
    const results = addPluginsByUrl(clonePluginUrl, installedPluginsNames, pluginsPath)
    installedPluginsNames.push(...results)
  } else {
    const results = await addOfficialPlugins(pluginsNames, installedPluginsNames, pluginsPath)
    installedPluginsNames.push(...results)
  }

  configuration.plugins = installedPluginsNames
    .filter((pluginName, idx, currentPlugins) => currentPlugins.indexOf(pluginName) === idx)

  saveConfiguration(configuration, projectPath)

  process.exit(1)
}

module.exports = addPlugins
