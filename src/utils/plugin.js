const path = require('path')
const fs = require('fs-extra')
const { PACKAGE_JSON_PATH, DEFAULT_PLUGIN_BRANCH } = require('../constants')

const readPackageJson = pluginPath => {
  const packageJsonPath = path.resolve(pluginPath, PACKAGE_JSON_PATH)
  return fs.readJsonSync(packageJsonPath, { throws: false }) || {}
}

const readDependencies = pluginPath => {
  const { dependencies, devDependencies } = readPackageJson(pluginPath)
  return Object.assign({}, dependencies, devDependencies)
}

const parseDependencyVersion = dependencyVersion => {
  let ref = DEFAULT_PLUGIN_BRANCH

  const parsedParts = /([~|^]?(\d+.\d+.\d+))|[*]/.exec(dependencyVersion)
  const version = parsedParts && parsedParts[2]
  if (version) {
    ref = `v${version}`
  }

  return ref
}

module.exports = {
  readPackageJson,
  readDependencies,
  parseDependencyVersion,
}
