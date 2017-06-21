const path = require('path')
const spawn = require('cross-spawn')
const { handleError, requireIfExist } = require('../core')
const githubApi = require('../githubApi')
const { readConfiguration, saveConfiguration } = require('../project')
const { installPlugins, selectPluginsToInstall } = require('../plugin')
const { commit: gitCommit, getChanges: gitGetChanges } = require('../git')
const { removeCache: removePluginsCache } = require('../packages')

const lernaBootstrapProjectNpm = projectPath => (
  spawn.sync(
    'npm',
    ['run', 'bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const lernaBootstrapProjectYarn = projectPath => (
  spawn.sync(
    'yarn',
    ['bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const bootstrapPluginsDeps = projectPath => {
  const { npmClient } = requireIfExist(path.resolve(projectPath, './lerna.json'))
  if (npmClient === 'npm') {
    lernaBootstrapProjectNpm(projectPath)
  } else {
    lernaBootstrapProjectYarn(projectPath)
  }
}

const updateConfiguration = (configuration, plugins, projectPath) => {
  const newPlugins = Array.from(configuration.plugins || [])
  const newRemotes = Object.assign({}, configuration.remotes || {})
  plugins.forEach(plugin => {
    newPlugins.push(plugin.name)
    newRemotes[plugin.name] = plugin.clone_url
  })
  saveConfiguration(Object.assign({}, configuration, {
    remotes: newRemotes,
    plugins: newPlugins,
  }), projectPath)
}

const getPluginsFromAvailableList = async pluginsNames => {
  const { data: { items: plugins } } = await githubApi.plugins()

  const notValidPluginsNames = []
  const pluginsToInstall = pluginsNames.map(pluginName => {
    const plugin = plugins.filter(({ name }) => name === pluginName)[0]
    if (!plugin) {
      notValidPluginsNames.push(pluginsNames)
    }
    return plugin
  })

  if (notValidPluginsNames.length > 0) {
    handleError(`Can't find plugins with names:\n - ${notValidPluginsNames.join(', ')}`)
  }

  return pluginsToInstall
}

const extractPluginNameFromUrl = cloneUrl => {
  const parts = cloneUrl.split('/')
  return parts[parts.length - 1].replace(/\.git$/, '')
}

const getPluginsByUrl = clonePluginUrl => {
  if (!clonePluginUrl.endsWith('.git')) {
    handleError(`Invalid plugin git url: ${clonePluginUrl}`)
  }

  return [{
    name: extractPluginNameFromUrl(clonePluginUrl),
    clone_url: clonePluginUrl,
  }]
}

const extractCloneUrl = pluginName => (
  pluginName && pluginName.startsWith('git:') ?
    pluginName.replace(/^git:/, '') : null
)

const getPluginsToInstall = async (pluginsNames, installedPluginsNames) => {
  let pluginsToInstall
  if (pluginsNames.length) {
    const clonePluginUrl = extractCloneUrl(pluginsNames[0])
    pluginsToInstall = (clonePluginUrl
      ? getPluginsByUrl(clonePluginUrl)
      : await getPluginsFromAvailableList(pluginsNames)
    ).filter(({ name }) => {
      if (installedPluginsNames.indexOf(name) !== -1) {
        console.log(`Plugin '${name}' already installed`)
        return false
      }
      return true
    })
  } else {
    pluginsToInstall = await selectPluginsToInstall(installedPluginsNames)
  }
  return pluginsToInstall
}

const addPlugins = async (...pluginsNames) => {
  const projectPath = process.cwd()
  const configuration = readConfiguration(projectPath)

  if (!configuration) {
    handleError('Can\'t find rispa project config')
  }

  const {
    mode,
    plugins: installedPluginsNames = [],
    pluginsPath: relPluginsPath = './packages',
  } = configuration
  const pluginsPath = path.resolve(projectPath, relPluginsPath)

  if (gitGetChanges(projectPath)) {
    handleError('Working tree has modifications. Cannot add plugins')
  }

  const pluginsToInstall = await getPluginsToInstall(
    pluginsNames,
    installedPluginsNames
  )

  installPlugins(pluginsToInstall, projectPath, pluginsPath, mode)

  updateConfiguration(configuration, pluginsToInstall, projectPath)

  bootstrapPluginsDeps(projectPath)

  gitCommit(projectPath,
    `Add plugins: ${pluginsToInstall.map(plugin => plugin.name).join(', ')}`
  )

  removePluginsCache(projectPath)

  process.exit(1)
}

module.exports = addPlugins
