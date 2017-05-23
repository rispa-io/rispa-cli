'use strict';

const glob = require('glob')
const fs = require('fs')
const path = require('path')

const { requireIfExist } = require('./core');

const BASE_PATH = process.cwd();
const ACTIVATORS_CACHE_PATH = path.resolve(BASE_PATH, './build/activators.json');
const ACTIVATORS_CACHE_DIR_PATH = path.dirname(ACTIVATORS_CACHE_PATH);
const LERNA_JSON_PATH = path.resolve(BASE_PATH, './lerna.json');

function saveCache(packagesByPaths, packages) {
  if (!fs.existsSync(ACTIVATORS_CACHE_DIR_PATH)) {
    fs.mkdirSync(ACTIVATORS_CACHE_DIR_PATH)
  }

  fs.writeFileSync(ACTIVATORS_CACHE_PATH, JSON.stringify({
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
  return glob.sync(packagesPath).reduce((result, packagePath) => {
    const packageJson = requireIfExist(`${packagePath}/package.json`)

    if (!packageJson || !packageJson['rispa:plugin']) {
      return result
    }

    const name = packageJson['name']
    const rispaName = packageJson['rispa:name']
    const activatorPath = `${packagePath}/.rispa/activator.js`;

    const packageInfo = {
      path: packagePath,
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
  const activatorsCache = requireIfExist(ACTIVATORS_CACHE_PATH)
  const lernaJson = requireIfExist(LERNA_JSON_PATH)

  const lernaPackagesPaths = lernaJson && lernaJson.packages ?
    lernaJson.packages.map(path => `${BASE_PATH}/${path}`) : []

  const packageScanPaths = [`${BASE_PATH}/node_modules/*`, ...lernaPackagesPaths]

  const packagesByPaths = packageScanPaths.reduce((result, path) => {
    const packages = activatorsCache && activatorsCache.paths[path] ?
      findPackagesByPathFromCache(path, activatorsCache) :
      findPackagesByPath(path)

    result[path] = packages;
    return result;
  }, {})

  const packages = Object.keys(packagesByPaths)
    .reduce((result, path) => Object.assign(result, packagesByPaths[path]), {})

  saveCache(packagesByPaths, packages)

  return packages;
}