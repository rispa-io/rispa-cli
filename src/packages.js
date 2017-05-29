const glob = require('glob')
const fs = require('fs-extra')
const path = require('path')

const { requireIfExist } = require('./core')

const saveCache = (packagesByPaths, packages, activatorsCachePath) => {
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

const packageInfoByPath = packagePath => {
  const packageJson = requireIfExist(`${packagePath}/package.json`)

  if (!packageJson || !packageJson.name.startsWith('@rispa/')) {
    return null
  }

  const name = packageJson.name
  const rispaName = packageJson['rispa:name']
  const activatorPath = path.resolve(packagePath, './.rispa/activator.js')
  const generatorsPath = path.resolve(packagePath, './.rispa/generators/index.js')

  return {
    path: packagePath,
    alias: rispaName,
    name,
    commands: packageJson.scripts ? Object.keys(packageJson.scripts) : [],
    activatorPath: fs.existsSync(activatorPath) && activatorPath,
    generatorsPath: fs.existsSync(generatorsPath) && generatorsPath,
  }
}

const findPackagesByPathFromCache = (packagesPath, cache) => {
  const packages = cache.paths[packagesPath] || []
  return packages
    .map(packageName => cache.packages[packageName])
    .filter(item => item)
    .reduce((result, packageInfo) => {
      if (packageInfo.alias) {
        result[packageInfo.alias] = packageInfo
      }
      result[packageInfo.name] = packageInfo

      return result
    }, {})
}

const findPackagesByPath = packagesPath => (
  glob.sync(packagesPath).reduce((result, packagePath) => {
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
)

const scanPackages = (projectPath = process.cwd()) => {
  const activatorsCachePath = path.resolve(projectPath, './build/activators.json')
  const activatorsCache = requireIfExist(activatorsCachePath)

  const lernaJson = requireIfExist(path.resolve(projectPath, './lerna.json'))
  const lernaPackagesPaths = lernaJson && lernaJson.packages ?
    lernaJson.packages.map(packagesPath => path.resolve(projectPath, packagesPath)) : []

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
