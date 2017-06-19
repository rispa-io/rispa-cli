/* eslint-disable no-console, import/no-dynamic-require, global-require */
const path = require('path')
const fs = require('fs-extra')
const { handleError } = require('../core')
const { readConfiguration, saveConfiguration } = require('../project')
const { pullRepository, updateSubtree } = require('../git')

const updatePluginRepository = (pluginsPath, pluginName) => {
  const pluginPath = `${pluginsPath}/${pluginName}`
  if (!fs.existsSync(`${pluginPath}/.git`)) {
    return false
  }

  console.log(`Update plugin repository with name: ${pluginName}`)
  pullRepository(pluginPath)

  return true
}

const updatePluginSubtree = (remotes, projectPath, pluginsPath, pluginName) => {
  const remoteUrl = remotes[pluginName]
  const pluginsRelPath = path.relative(projectPath, pluginsPath)
  const prefix = `${pluginsRelPath}/${pluginName}`

  console.log(`Update plugin subtree with name: ${pluginName}`)
  updateSubtree(projectPath, prefix, pluginName, remoteUrl)

  return true
}

const configurationIsValid = configuration =>
  configuration && configuration.plugins && configuration.pluginsPath

const updatePlugins = async (projectPath = process.cwd()) => {
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

  const update = mode === 'dev'
    ? updatePluginRepository.bind(null, pluginsPath)
    : updatePluginSubtree.bind(null, remotes, projectPath, pluginsPath)

  const updatedPlugins = plugins.filter(update)

  saveConfiguration(Object.assign({}, configuration, {
    plugins: updatedPlugins,
    remotes: updatedPlugins.reduce((newRemotes, plugin) => {
      newRemotes[plugin] = remotes[plugin]
      return newRemotes
    }, {}),
  }), projectPath)

  process.exit(1)
}

module.exports = updatePlugins
