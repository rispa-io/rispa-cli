const path = require('path')
const fs = require('fs-extra')
const { PACKAGE_JSON_PATH, DEFAULT_PLUGIN_BRANCH, PLUGIN_GIT_PREFIX } = require('../constants')

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

const extractPluginNameFromUrl = cloneUrl => {
  const parts = cloneUrl.split('/')
  return parts[parts.length - 1].replace(/\.git$/, '')
}

const findInList = (plugin, pluginList) => {
  if (typeof plugin === 'object') {
    return plugin
  } else if (plugin.startsWith(PLUGIN_GIT_PREFIX)) {
    return {
      name: extractPluginNameFromUrl(plugin),
      cloneUrl: plugin.replace(PLUGIN_GIT_PREFIX, ''),
    }
  }

  const currentPlugin = pluginList.find(({ name, packageName, packageAlias }) =>
    name === plugin || packageName === plugin || packageAlias === plugin
  )

  return currentPlugin || { name: plugin }
}

module.exports = {
  readPackageJson,
  readDependencies,
  parseDependencyVersion,
  extractPluginNameFromUrl,
  findInList,
}
