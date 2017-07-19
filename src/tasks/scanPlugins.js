const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const { readPluginsPaths } = require('../utils/lerna')
const { readPackageJson } = require('../utils/plugin')
const { savePluginsCache, readPluginsCache } = require('../utils/pluginsCache')
const {
  PLUGIN_PREFIX,
  PLUGIN_ALIAS,
  PLUGIN_ACTIVATOR_PATH,
  PLUGIN_GENERATORS_PATH,
  PLUGIN_POSTINSTALL,
} = require('../constants')

const getPluginInfo = ([pluginPath, packageInfo, npm]) => {
  const name = packageInfo.name
  const rispaName = packageInfo[PLUGIN_ALIAS]
  const postinstall = packageInfo[PLUGIN_POSTINSTALL]
  const activatorPath = path.resolve(pluginPath, PLUGIN_ACTIVATOR_PATH)
  const generatorsPath = path.resolve(pluginPath, PLUGIN_GENERATORS_PATH)

  return {
    name,
    npm,
    postinstall,
    path: pluginPath,
    alias: rispaName,
    scripts: packageInfo.scripts ? Object.keys(packageInfo.scripts) : [],
    activator: fs.existsSync(activatorPath) && activatorPath,
    generators: fs.existsSync(generatorsPath) && generatorsPath,
  }
}

const getPluginsFromCache = (pluginsPath, cache) => {
  if (!(pluginsPath in cache.paths)) {
    return null
  }

  return cache.paths[pluginsPath]
    .map(pluginName => cache.plugins[pluginName])
    .filter(item => item)
    .reduce((result, packageInfo) => {
      if (packageInfo.alias) {
        result[packageInfo.alias] = packageInfo
      }
      result[packageInfo.name] = packageInfo

      return result
    }, {})
}

const createPluginCheck = strict => ([, packageInfo]) => (
  packageInfo.name && (!strict || (strict && packageInfo.name.startsWith(PLUGIN_PREFIX)))
)

const scanPluginsByPath = (pluginsPath, { npm }) =>
  glob.sync(pluginsPath)
    .filter(pluginPath => !fs.lstatSync(pluginPath).isSymbolicLink())
    .map(pluginPath => [pluginPath, readPackageJson(pluginPath), npm])
    .filter(createPluginCheck(npm))
    .map(getPluginInfo)
    .reduce((result, plugin) => {
      if (plugin.alias) {
        result[plugin.alias] = plugin
      }

      result[plugin.name] = plugin
      return result
    }, {})

const getPluginsByPaths = (pluginsPaths, cache, options) => (
  pluginsPaths.reduce((result, pluginsPath) => (
    Object.assign(result, {
      [pluginsPath]: (
        getPluginsFromCache(pluginsPath, cache) ||
        scanPluginsByPath(pluginsPath, options)
      ),
    })
  ), {})
)

const scanPluginsTask = ctx => {
  const { projectPath } = ctx
  const pluginsCache = readPluginsCache(projectPath)
  const pluginsPaths = readPluginsPaths(projectPath)

  const pluginsByPaths = Object.assign(
    getPluginsByPaths(pluginsPaths.lerna, pluginsCache, { npm: false }),
    getPluginsByPaths(pluginsPaths.nodeModules, pluginsCache, { npm: true })
  )

  const plugins = Object.values(pluginsByPaths).reduce((result, pluginsByPath) => (
    Object.assign(result, pluginsByPath)
  ), {})

  savePluginsCache(pluginsByPaths, plugins, projectPath)

  ctx.projectPath = projectPath
  ctx.plugins = plugins
}

const scanPlugins = {
  title: 'Scan plugins',
  task: scanPluginsTask,
}

module.exports = scanPlugins
