const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const { readPackageJson, readPluginsPaths } = require('../utils/plugin')
const { savePluginsCache, readPluginsCache } = require('../utils/pluginsCache')
const {
  PLUGIN_PREFIX,
  PLUGIN_ALIAS,
  PLUGIN_ACTIVATOR,
  PLUGIN_GENERATORS,
  PLUGIN_POSTINSTALL,
} = require('../constants')

const getPluginInfo = ([pluginPath, packageInfo, npm]) => {
  const activatorPath = packageInfo[PLUGIN_ACTIVATOR]
  const generatorsPath = packageInfo[PLUGIN_GENERATORS]

  return {
    name: path.basename(pluginPath),
    packageName: packageInfo.name,
    packageAlias: packageInfo[PLUGIN_ALIAS],
    scripts: packageInfo.scripts ? Object.keys(packageInfo.scripts) : [],
    npm,
    postinstall: packageInfo[PLUGIN_POSTINSTALL],
    path: pluginPath,
    activator: activatorPath && path.resolve(pluginPath, activatorPath),
    generators: generatorsPath && path.resolve(pluginPath, generatorsPath),
  }
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
      result[plugin.name] = plugin
      return result
    }, {})

const getPluginsByPaths = (pluginsPaths, options) => (
  pluginsPaths.reduce((result, pluginsPath) => (
    Object.assign(result, {
      [pluginsPath]: scanPluginsByPath(pluginsPath, options),
    })
  ), {})
)

const readPlugins = projectPath => {
  const pluginsCache = readPluginsCache(projectPath)
  if (pluginsCache && 'plugins' in pluginsCache) {
    return pluginsCache.plugins
  }

  const pluginsPaths = readPluginsPaths(projectPath)

  const pluginsByPaths = Object.values(Object.assign(
    getPluginsByPaths(pluginsPaths.workspaces, { npm: false }),
    getPluginsByPaths(pluginsPaths.nodeModules, { npm: true })
  ))

  const plugins = Object.values(
    pluginsByPaths.reduce((result, pluginsByPath) => Object.assign(result, pluginsByPath), {})
  )

  savePluginsCache(projectPath, plugins)

  return plugins
}

const scanPluginsTask = ctx => {
  const { projectPath } = ctx

  ctx.projectPath = projectPath
  ctx.plugins = readPlugins(projectPath)
}

const scanPlugins = {
  title: 'Scan plugins',
  task: scanPluginsTask,
}

module.exports = scanPlugins
