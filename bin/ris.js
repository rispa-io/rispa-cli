#!/usr/bin/env node
'use strict';

const spawn = require('cross-spawn')
const glob = require('glob')
const fs = require('fs')
const path = require('path')
const { prompt } = require('inquirer')

const ACTIVATORS_CACHE_PATH = '../build/activators.json';
const LERNA_JSON_PATH = '../lerna.json';

let packageName = process.argv[2]
let command = process.argv[3]
const args = process.argv.slice(4)

const useYarn = fs.existsSync('./yarn.lock')

run(packageName, command, args, useYarn);

function run(packageName, command, args, useYarn) {

  const packages = scanPackages();

  if (!Object.keys(packages).length) {
    console.log(`Can't find packages.`)
    process.exit(1)
  }

  if (packageName === 'all') {
    runInAllPackages(packages, command, args, useYarn)
  } else {
    runInSinglePackage(packageName, packages, command, args, useYarn)
  }
}

function runInAllPackages(packages, command, args, useYarn) {
  const packageInfoList = Object.values(packages)
    .filter((value, idx, values) => values.indexOf(value) === idx);

  if (!packageInfoList.find(({ commands }) => commands.indexOf(command) !== -1)) {
    console.log(`Can't find command "${command}" in packages.\n`)
    process.exit(1)
  }

  const result = callScriptList(packageInfoList, command, args, useYarn)
  process.exit(result)
}

function runInSinglePackage(packageName, packages, command, args, useYarn) {

  const packageInfo = packages[packageName]
  const callScriptStrategy = callScript(useYarn)

  if (!packageInfo) {

    console.log(`Can't find package with name: ${packageName}.\n`)

    selectPackage(packages).then(async ({ packageName }) => {
      const packageInfo = packages[packageName]

      const { command } = await selectCommand(packageInfo.commands)

      const result = callScriptStrategy(packageInfo, command, args, useYarn)
      process.exit(result)
    }).catch(handleError);
  } else if (packageInfo.commands.indexOf(command) === -1) {

    console.log(`Can't find command "${command}" in package with name: ${packageName}.\n`)

    selectCommand(packageInfo.commands).then(({ command }) => {
      const result = callScriptStrategy(packageInfo, command, args, useYarn)
      process.exit(result)
    }).catch(handleError);
  } else {
    const result = callScriptStrategy(packageInfo, command, args)
    process.exit(result)
  }

  function selectPackage(packages) {
    return prompt([{
      type: 'list',
      name: 'packageName',
      message: 'Select available package:',
      paginated: true,
      choices: [...new Set(Object.keys(packages).map(key => packages[key].name))]
    }])
  }

  function selectCommand(commands) {
    return prompt([{
      type: 'list',
      name: 'command',
      message: 'Select available command:',
      paginated: true,
      choices: commands
    }])
  }
}

function scanPackages() {
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

function findPackagesByPath(path) {
  return glob.sync(path).reduce((result, packageFolder) => {
    const packageJson = requireIfExist(`../${packageFolder}/package.json`)
    if (!packageJson || !packageJson['rispa:plugin']) {
      return result
    }

    const name = packageJson['name']
    const rispaName = packageJson['rispa:name']
    const activatorPath = `../${packageFolder}/.rispa/activator.js`;

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

function callScriptList(packageInfoList, command, args, useYarn) {
  const callScriptStrategy = callScript(useYarn);
  return packageInfoList
    .reduce((result, packageInfo) => callScriptStrategy(packageInfo, command, args) || result, 0)
}

function callScript(useYarn = false) {
  return useYarn ? callScriptByYarn : callScriptByNpm
}

function callScriptByYarn(packageInfo, command, args) {
  return spawn.sync(
    'yarn',
    [command].concat(args),
    {
      cwd: packageInfo.path,
      stdio: 'inherit',
    }
  ).status
}

function callScriptByNpm(packageInfo, command, args) {
  return spawn.sync(
    'npm',
    ['run', command].concat(args),
    {
      cwd: packageInfo.path,
      stdio: 'inherit',
    }
  ).status
}

function requireIfExist(id) {
  try {
    return require(id)
  } catch (e) {
    if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
      return null
    }
    throw e;
  }
}

function handleError(error) {
  console.log(e)
  process.exit(1)
}
