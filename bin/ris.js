#!/usr/bin/env node
'use strict';

const spawn = require('cross-spawn')
const glob = require('glob')
const fs = require('fs')
const path = require('path')
const { prompt } = require('inquirer')

let packageName = process.argv[2]
let command = process.argv[3]
const args = process.argv.slice(4)

const useYarn = fs.existsSync('./yarn.lock')

const lernaJson = requireIfExist('../lerna.json')
const packagePaths = ['node_modules/*'].concat(lernaJson && lernaJson.packages ? lernaJson.packages : [])

run(packageName, findPackages(packagePaths), command, args, useYarn);

function run(packageName, packages, command, args, useYarn) {
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
  if (!packages[packageName]) {
    console.log(`Can't find package with name: ${packageName}.\n`)

    selectPackage(packages).then(async ({ packageName }) => {
      const packageInfo = packages[packageName]

      const { command } = await selectCommand(packageInfo.commands)

      const result = callScript(packages[packageName], command, args, useYarn)
      process.exit(result)
    }).catch(e => {
      console.log(e)
      process.exit(1)
    });
  } else {
    const result = callScript(packages[packageName], command, args, useYarn)
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

function findPackages(packagePaths) {
  return packagePaths.map(packagePath =>
    glob.sync(packagePath).reduce((result, packageFolder) => {
      const packageJson = requireIfExist(`../${packageFolder}/package.json`)
      if (!packageJson || !packageJson['rispa:plugin']) {
        return result
      }

      const name = packageJson['name']
      const rispaName = packageJson['rispa:name']

      const packageInfo = {
        path: packageFolder,
        alias: rispaName,
        name: name,
        commands: Object.keys(packageJson.scripts)
      }

      if (rispaName) {
        result[rispaName] = packageInfo
      }

      result[packageInfo.name] = packageInfo

      return result
    }, {})
  ).reduce((result, currentResult) => Object.assign(result, currentResult))
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
