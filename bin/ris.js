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

const useYarn = fs.existsSync('../yarn.lock')

const lernaJson = requireIfExist('../lerna.json')

const packagePaths = ['node_modules/*'].concat(lernaJson && lernaJson.packages ? lernaJson.packages : [])

const packages = packagePaths.map(packagePath =>
  glob.sync(packagePath).reduce((result, packageFolder) => {
    const packageJson = requireIfExist(`../${packageFolder}/package.json`)
    if (!packageJson || !packageJson['rispa:plugin']) {
      return result
    }

    const name = packageJson['name']
    const rispaName = packageJson['rispa:name']

    if (packageName === 'all' && !(packageJson.scripts && command in packageJson.scripts)) {
      return result
    }

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

if (packageName === 'all') {
  const result = callScriptList(packages, command, args)
  process.exit(result)
} else if (!packages[packageName]) {
  console.log(`Can't find package with name: ${packageName}.\n`)

  selectPackage(packages).then(async ({ packageName }) => {
    const packageInfo = packages[packageName]

    const { command } = await selectCommand(packageInfo.commands)

    const result = callScript(packages[packageName], command, args)
    process.exit(result)
  }).catch(e => {
    console.log(e)
    process.exit(1)
  });
} else {
  const result = callScript(packages[packageName], command, args)
  process.exit(result)
}

function selectPackage(packages) {
  return prompt([{
    type: 'list',
    name: 'packageName',
    message: 'Select available package:',
    paginated: true,
    choices: [...new Set(Object.keys(packages).map((key) => packages[key]))]
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

function callScriptList(packages, command, args) {
  return Object.values(packages)
    .reduce((result, packageInfo) => callScript(packageInfo, command, args) || result, 0)
}

function callScript(packageInfo, command, args) {
  return spawn.sync(
    useYarn ? 'yarn' : "npm",
    [...(useYarn ? [] : ["run"]), command].concat(args),
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
