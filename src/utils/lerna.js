const path = require('path')
const fs = require('fs-extra')
const { LERNA_JSON_PATH, NODE_MODULES_PLUGINS_PATH } = require('../constants')

const readPluginsPaths = projectPath => {
  const lernaJsonPath = path.resolve(projectPath, LERNA_JSON_PATH)
  const { packages: lernaPackages } = fs.readJsonSync(lernaJsonPath, { throws: false }) || {}
  if (!lernaPackages) {
    throw new Error('Incorrect configuration file `lerna.json`')
  }

  const lernaPluginsPaths = lernaPackages.map(pluginsPath => path.resolve(projectPath, `./${pluginsPath}`))
  const nodeModulesPluginsPaths = lernaPluginsPaths
    .map(pluginsPath => path.resolve(pluginsPath, NODE_MODULES_PLUGINS_PATH))
    .concat(path.resolve(projectPath, NODE_MODULES_PLUGINS_PATH))

  return {
    nodeModules: nodeModulesPluginsPaths,
    lerna: lernaPluginsPaths,
  }
}

module.exports = {
  readPluginsPaths,
}
