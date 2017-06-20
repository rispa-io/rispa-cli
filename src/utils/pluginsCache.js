const path = require('path')
const fs = require('fs-extra')

const createPluginsCache = () => ({
  paths: {},
  plugins: {},
})

const savePluginsCache = (pluginsByPaths, packages, projectPath) => {
  const pluginsCachePath = path.resolve(projectPath, './build/plugins.json')
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
  const pluginsCachePath = path.resolve(projectPath, './build/plugins.json')
  const pluginsCache = fs.readJsonSync(pluginsCachePath, { throws: false })

  return pluginsCache || createPluginsCache()
}

module.exports = {
  createPluginsCache,
  savePluginsCache,
  readPluginsCache,
}
