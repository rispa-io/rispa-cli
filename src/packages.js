/* eslint-disable no-use-before-define, no-console, import/no-dynamic-require, global-require */

const glob = require('glob')
const fs = require('fs')
const path = require('path')

const { requireIfExist } = require('./core')

const BASE_PATH = process.cwd()
const ACTIVATORS_CACHE_PATH = path.resolve(BASE_PATH, './build/activators.json')
const ACTIVATORS_CACHE_DIR_PATH = path.dirname(ACTIVATORS_CACHE_PATH)
const LERNA_JSON_PATH = path.resolve(BASE_PATH, './lerna.json')

function saveCache(packagesByPaths, packages) {
  if (!fs.existsSync(ACTIVATORS_CACHE_DIR_PATH)) {
    fs.mkdirSync(ACTIVATORS_CACHE_DIR_PATH)
  }

  fs.writeFileSync(ACTIVATORS_CACHE_PATH, JSON.stringify({
    paths: Object.keys(packagesByPaths)
      .reduce((result, packagesPath) => {
        const currentPackages = packagesByPaths[packagesPath]
        result[packagesPath] = Object.keys(currentPackages)
          .filter((key, idx, keys) => keys.indexOf(currentPackages[key].name) === idx)
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

function findPackagesByPathFromCache(packagesPath, cache) {
  return cache.paths[packagesPath].reduce((result, packageName) => {
    const packageInfo = cache.packages[packageName]

    if (packageInfo.alias) {
      result[packageInfo.alias] = packageInfo
    }

    result[packageInfo.name] = packageInfo

    return result
  }, {})
}

function findPackagesByPath(packagesPath) {
  return glob.sync(packagesPath).reduce((result, packagePath) => {
    const packageInfo = packageInfoByPath(packagePath)
    if (!packageInfo) {
      return result
    }

    if (packageInfo.alias) {
      result[packageInfo.alias] = packageInfo
    }

    result[packageInfo.name] = packageInfo

    return result
  }, {})
}

function packageInfoByPath(packagePath) {
  const packageJson = requireIfExist(`${packagePath}/package.json`)

  if (!packageJson || !packageJson['rispa:plugin']) {
    return null
  }

  const name = packageJson.name
  const rispaName = packageJson['rispa:name']
  const activatorPath = `${packagePath}/.rispa/activator.js`

  return {
    path: packagePath,
    alias: rispaName,
    name,
    commands: packageJson.scripts ? Object.keys(packageJson.scripts) : [],
    activatorPath: fs.existsSync(activatorPath) && activatorPath,
  }
}

module.exports = function scanPackages() {
  const activatorsCache = requireIfExist(ACTIVATORS_CACHE_PATH)
  const lernaJson = requireIfExist(LERNA_JSON_PATH)

  const lernaPackagesPaths = lernaJson && lernaJson.packages ?
    lernaJson.packages.map(packagesPath => `${BASE_PATH}/${packagesPath}`) : []

  const packageScanPaths = [`${BASE_PATH}/node_modules/*`, ...lernaPackagesPaths]

  const packagesByPaths = packageScanPaths.reduce((result, packagesPath) => {
    const packages = activatorsCache && activatorsCache.paths[packagesPath] ?
      findPackagesByPathFromCache(packagesPath, activatorsCache) :
      findPackagesByPath(packagesPath)

    result[path] = packages
    return result
  }, {})

  const packages = Object.keys(packagesByPaths)
    .reduce((result, packagesPath) => Object.assign(result, packagesByPaths[packagesPath]), {})

  saveCache(packagesByPaths, packages)

  return packages
}
