const path = require('path')
const fs = require('fs-extra')
const { LERNA_JSON_PATH, PLUGIN_PREFIX } = require('../constants')

const readPluginsPaths = projectPath => {
  const lernaJsonPath = path.resolve(projectPath, LERNA_JSON_PATH)
  const { packages: lernaPackages } = fs.readJsonSync(lernaJsonPath, { throws: false })
  if (!lernaPackages) {
    throw new Error('Incorrect configuration file `lerna.json`')
  }

  const pluginsPaths = lernaPackages.reduce((paths, pluginsPath) => {
    paths.push(path.resolve(projectPath, `./${pluginsPath}`))
    return paths
  }, [path.resolve(projectPath, `./node_modules/${PLUGIN_PREFIX}*`)])

  return pluginsPaths
}

module.exports = {
  readPluginsPaths,
}
