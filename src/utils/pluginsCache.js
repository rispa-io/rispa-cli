const path = require('path')
const fs = require('fs-extra')

const createPluginsCache = () => ({
  paths: {},
  plugins: {},
})

const savePluginsCache = () => {

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
