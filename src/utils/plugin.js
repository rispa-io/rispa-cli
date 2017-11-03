const path = require('path')
const fs = require('fs-extra')
const spawn = require('cross-spawn')
const { PACKAGE_JSON_PATH, DEFAULT_PLUGIN_BRANCH, PLUGIN_GIT_PREFIX } = require('../constants')

const readPackageJson = rootPath => {
  const packageJsonPath = path.resolve(rootPath, PACKAGE_JSON_PATH)
  return fs.readJsonSync(packageJsonPath, { throws: false }) || {}
}

const savePackageJson = (rootPath, packageInfo) => {
  const packageJsonPath = path.resolve(rootPath, PACKAGE_JSON_PATH)
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageInfo, null, 2))
}

const readDependencies = pluginPath => {
  const { dependencies, devDependencies } = readPackageJson(pluginPath)
  return Object.assign({}, dependencies, devDependencies)
}

const addDevDependency = (projectPath, packageName, packageVersion = 'latest') => {
  const packageInfo = readPackageJson(projectPath)
  if (Object.keys(packageInfo).length === 0) {
    throw new Error('Failed read `package.json`')
  }

  packageInfo.devDependencies = Object.assign({}, packageInfo.devDependencies, {
    [packageName]: packageVersion,
  })

  savePackageJson(projectPath, packageInfo)
}

const removeDevDependency = (projectPath, packageName) => {
  const packageInfo = readPackageJson(projectPath)
  if (Object.keys(packageInfo).length === 0) {
    throw new Error('Failed read `package.json`')
  }

  if (packageInfo.devDependencies) {
    delete packageInfo.devDependencies[packageName]
  }

  savePackageJson(projectPath, packageInfo)
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

const getPluginName = plugin => {
  if (plugin && typeof plugin === 'object') {
    if ('packageAlias' in plugin && plugin.packageAlias) {
      return plugin.packageAlias
    } else if ('packageName' in plugin && plugin.packageName) {
      return plugin.packageName
    } else if ('name' in plugin && plugin.name) {
      return plugin.name
    }

    throw new Error('Plugin does not contain name')
  }

  throw new TypeError('Invalid plugin type')
}

const equalPluginName = (pluginName, plugin) => (
  pluginName === plugin.name || pluginName === plugin.packageName || pluginName === plugin.packageAlias
)

const findPluginByName = (list, pluginName) => list.find(
  plugin => equalPluginName(pluginName, plugin)
)

const findPluginForInstall = (plugin, plugins) => {
  if (typeof plugin === 'object') {
    return plugin
  } else if (typeof plugin === 'string') {
    if (plugin.startsWith(PLUGIN_GIT_PREFIX)) {
      return {
        name: extractPluginNameFromUrl(plugin),
        remote: plugin.replace(PLUGIN_GIT_PREFIX, ''),
      }
    }

    return findPluginByName(plugins, plugin)
  }

  throw new TypeError('Invalid plugin type')
}

const publishToNpm = pluginPath => {
  const result = spawn.sync(
    'npm',
    ['publish', './', '--access=public'],
    { cwd: pluginPath, stdio: 'inherit' }
  )

  if (result.status !== 0) {
    throw new Error('Failed publish to npm')
  }

  return result
}

const compareVersions = (version1, version2) => {
  const major = parseInt(version1.major, 10) - parseInt(version2.major, 10)
  if (major !== 0) {
    return major
  }

  const minor = parseInt(version1.minor, 10) - parseInt(version2.minor, 10)
  if (minor !== 0) {
    return minor
  }

  return parseInt(version1.patch, 10) - parseInt(version2.patch, 10)
}

module.exports = {
  readPackageJson,
  readDependencies,
  parseDependencyVersion,
  extractPluginNameFromUrl,
  getPluginName,
  findPluginForInstall,
  equalPluginName,
  findPluginByName,
  savePackageJson,
  publishToNpm,
  compareVersions,
  addDevDependency,
  removeDevDependency,
}
