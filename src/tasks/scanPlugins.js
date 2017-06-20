const path = require('path')
const fs = require('fs-extra')
const glob = require('glob')
const { savePluginsCache, readPluginsCache } = require('../utils/pluginsCache')
const { readPluginsPaths } = require('../utils/lerna')

const getPluginInfo = pluginPath => {
  const packageJson = fs.readJsonSync(path.resolve(pluginPath, './package.json'), { throws: false })

  if (!packageJson || !packageJson.name.startsWith('@rispa/')) {
    return null
  }

  const name = packageJson.name
  const rispaName = packageJson['rispa:name']
  const activatorPath = path.resolve(pluginPath, './.rispa/activator.js')
  const generatorsPath = path.resolve(pluginPath, './.rispa/generators/index.js')

  return {
    name,
    path: pluginPath,
    alias: rispaName,
    scripts: packageJson.scripts ? Object.keys(packageJson.scripts) : [],
    activator: fs.existsSync(activatorPath) && activatorPath,
    generator: fs.existsSync(generatorsPath) && generatorsPath,
  }
}

const getPluginsFromCache = (packagesPath, cache) => {
  if (!(packagesPath in cache)) {
    return null
  }

  const packages = cache.paths[packagesPath] || []
  return packages
    .map(packageName => cache.packages[packageName])
    .filter(item => item)
    .reduce((result, packageInfo) => {
      if (packageInfo.alias) {
        result[packageInfo.alias] = packageInfo
      }
      result[packageInfo.name] = packageInfo

      return result
    }, {})
}

const scanPluginsByPath = pluginsPath => (
  glob.sync(pluginsPath).reduce((result, packagePath) => {
    const pluginInfo = getPluginInfo(packagePath)
    if (!pluginInfo) {
      return result
    }

    if (pluginInfo.alias) {
      result[pluginInfo.alias] = pluginInfo
    }

    result[pluginInfo.name] = pluginInfo

    return result
  }, {})
)

const scanPluginsTask = ctx => {
  const { projectPath } = ctx
  const pluginsCache = readPluginsCache(projectPath)
  const pluginsPaths = readPluginsPaths(projectPath)

  const pluginsByPaths = pluginsPaths.reduce((result, pluginsPath) => (
    Object.assign(result, {
      [pluginsPath]: getPluginsFromCache(pluginsPath, pluginsCache) || scanPluginsByPath(pluginsPath),
    })
  ), {})

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
