const path = require('path')
const fs = require('fs-extra')

const CACHE_PATH = './build/plugins.json'

const createPluginsCache = () => ({
  paths: {},
  plugins: {},
})

const savePluginsCache = (pluginsByPaths, packages, projectPath) => {
  const pluginsCachePath = path.resolve(projectPath, CACHE_PATH)
  const pluginsCacheDirPath = path.dirname(pluginsCachePath)

  fs.ensureDirSync(pluginsCacheDirPath)

  fs.writeFileSync(pluginsCachePath, JSON.stringify({
    paths: Object.keys(pluginsByPaths)
      .reduce((result, pluginsPath) => {
        const plugins = pluginsByPaths[pluginsPath]
        result[pluginsPath] = Object.keys(plugins)
          .filter((key, idx, keys) => keys.indexOf(plugins[key].name) === idx)
        return result
      }, {}),

    packages: Object.keys(packages)
      .filter((key, idx, keys) => keys.indexOf(packages[key].name) === idx)
      .reduce((result, key) => {
        result[key] = packages[key]
        return result
      }, {}),
  }, null, 2))
}

const readPluginsCache = projectPath => {
  const pluginsCachePath = path.resolve(projectPath, CACHE_PATH)
  const pluginsCache = fs.readJsonSync(pluginsCachePath, { throws: false })

  return pluginsCache || createPluginsCache()
}

const removePluginsCache = projectPath => {
  const pluginsCachePath = path.resolve(projectPath, CACHE_PATH)
  fs.removeSync(pluginsCachePath)
}

module.exports = {
  createPluginsCache,
  savePluginsCache,
  readPluginsCache,
  removePluginsCache,
}
