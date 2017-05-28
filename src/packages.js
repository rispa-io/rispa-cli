const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')

const { requireIfExist } = require('./core')

function saveCache(packagesByPaths, packages, activatorsCachePath) {
  const activatorsCacheDirPath = path.dirname(activatorsCachePath)

  fs.ensureDirSync(activatorsCacheDirPath)

  fs.writeFileSync(activatorsCachePath, JSON.stringify({
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

function findPackagesByPathFromCache(packagesPath, cache) {
  const packages = cache.paths[packagesPath]
  return packages ? packages.reduce((result, packageName) => {
    const packageInfo = cache.packages[packageName]

    if (packageInfo.alias) {
      result[packageInfo.alias] = packageInfo
    }
    result[packageInfo.name] = packageInfo

    return result
  }, {}) : {}
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

function scanPackages(projectPath = process.cwd()) {
  const activatorsCachePath = path.resolve(projectPath, './build/activators.json')
  const activatorsCache = requireIfExist(activatorsCachePath)

  const lernaJson = requireIfExist(path.resolve(projectPath, './lerna.json'))
  const lernaPackagesPaths = lernaJson && lernaJson.packages ?
    lernaJson.packages.map(packagesPath => `${projectPath}/${packagesPath}`) : []

  const packageScanPaths = [`${projectPath}/node_modules/*`, ...lernaPackagesPaths]
  const packagesByPaths = packageScanPaths.reduce((result, packagesPath) => {
    const packages = activatorsCache && activatorsCache.paths[packagesPath] ?
      findPackagesByPathFromCache(packagesPath, activatorsCache) :
      findPackagesByPath(packagesPath)

    result[packagesPath] = packages

    return result
  }, {})

  const packages = Object.keys(packagesByPaths)
    .reduce((result, packagesPath) => Object.assign(result, packagesByPaths[packagesPath]), {})

  saveCache(packagesByPaths, packages, activatorsCachePath)

  return packages
}

module.exports = {
  scanPackages, saveCache, packageInfoByPath, findPackagesByPathFromCache, findPackagesByPath,
}
