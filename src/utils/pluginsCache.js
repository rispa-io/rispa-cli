const path = require('path')
const fs = require('fs-extra')
const { PLUGINS_CACHE_PATH } = require('../constants')

const savePluginsCache = (projectPath, plugins) => {
  const pluginsCachePath = path.resolve(projectPath, PLUGINS_CACHE_PATH)
  const pluginsCacheDirPath = path.dirname(pluginsCachePath)

  fs.ensureDirSync(pluginsCacheDirPath)

  fs.writeFileSync(pluginsCachePath, JSON.stringify({
    plugins,
  }, null, 2))
}

const readPluginsCache = projectPath => {
  const pluginsCachePath = path.resolve(projectPath, PLUGINS_CACHE_PATH)
  const pluginsCache = fs.readJsonSync(pluginsCachePath, { throws: false })

  return pluginsCache
}

const removePluginsCache = projectPath => {
  const pluginsCachePath = path.resolve(projectPath, PLUGINS_CACHE_PATH)
  fs.removeSync(pluginsCachePath)
}

module.exports = {
  savePluginsCache,
  readPluginsCache,
  removePluginsCache,
}
