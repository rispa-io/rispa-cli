'use strict';

const glob = require('glob')
const fs = require('fs')
const path = require('path')

const { requireIfExist } = require('./core');

const ACTIVATORS_CACHE_PATH = '../build/activators.json';
const LERNA_JSON_PATH = '../lerna.json';

function saveCache(packagesByPaths, packages) {
  const cachePath = path.resolve(__dirname, ACTIVATORS_CACHE_PATH)
  const cacheDirPath = path.dirname(cachePath)

  if (!fs.existsSync(cacheDirPath)) {
    fs.mkdirSync(cacheDirPath)
  }

  fs.writeFileSync(cachePath, JSON.stringify({
    paths: Object.keys(packagesByPaths)
      .reduce((result, path) => {
        const packages = packagesByPaths[path]
        result[path] = Object.keys(packages).filter((key, idx, keys) => keys.indexOf(packages[key].name) === idx)
        return result
      }, {}),

    packages: Object.keys(packages)
      .filter((key, idx, keys) => keys.indexOf(packages[key].name) === idx)
      .reduce((result, key) => {
        result[key] = packages[key]
        return result
      }, {})
  }, null, 2))
}

function findPackagesByPathFromCache(path, cache) {
  return cache.paths[path].reduce((result, packageName) => {
    const packageInfo = cache.packages[packageName];

    if (packageInfo.alias) {
      result[packageInfo.alias] = packageInfo
    }

    result[packageInfo.name] = packageInfo

    return result
  }, {})
}

function findPackagesByPath(packagesPath) {
  return glob.sync(packagesPath).reduce((result, packageFolder) => {
    const packageJson = requireIfExist(`../${packageFolder}/package.json`)
    if (!packageJson || !packageJson['rispa:plugin']) {
      return result
    }

    const name = packageJson['name']
    const rispaName = packageJson['rispa:name']
    const activatorPath = path.resolve(__dirname, `../${packageFolder}/.rispa/activator.js`);

    const packageInfo = {
      path: packageFolder,
      alias: rispaName,
      name: name,
      commands: Object.keys(packageJson.scripts),
      activatorPath: fs.existsSync(activatorPath) ? activatorPath : null
    }

    if (rispaName) {
      result[rispaName] = packageInfo
    }

    result[packageInfo.name] = packageInfo

    return result
  }, {})
}

module.exports = function scanPackages() {
  const cache = requireIfExist(ACTIVATORS_CACHE_PATH)
  const lernaJson = requireIfExist(LERNA_JSON_PATH)

  const packageScanPaths = ['node_modules/*'].concat(lernaJson && lernaJson.packages ? lernaJson.packages : [])
  const packagesByPaths = packageScanPaths.reduce((result, path) => {
    const packages = cache && cache.paths[path] ?
      findPackagesByPathFromCache(path, cache) :
      findPackagesByPath(path)

    result[path] = packages;
    return result;
  }, {})
  const packages = Object.keys(packagesByPaths).reduce((result, path) => Object.assign(result, packagesByPaths[path]), {})

  saveCache(packagesByPaths, packages)

  return packages;
}