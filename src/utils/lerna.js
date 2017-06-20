const path = require('path')
const fs = require('fs-extra')

const readPluginsPaths = projectPath => {
  const lernaJsonPath = path.resolve(projectPath, './lerna.json')
  const { packages: lernaPackages } = fs.readJsonSync(lernaJsonPath, { throws: false })
  if (!lernaPackages) {
    throw new Error('Incorrect configuration file `lerna.json`')
  }

  const pluginsPaths = lernaPackages.reduce((paths, pluginsPath) => {
    paths.push(pluginsPath)
    return paths
  }, [`${projectPath}/node_modules/*`])

  return pluginsPaths
}

module.exports = {
  readPluginsPaths,
}
