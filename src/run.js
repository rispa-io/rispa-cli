'use strict';

const spawn = require('cross-spawn')
const glob = require('glob')
const fs = require('fs')
const path = require('path')
const { prompt } = require('inquirer')

const {
  handleError, requireIfExist,
  callScript, callScriptList
} = require('./core');
const scanPackages = require('./packages');

function run(packageName, command, ...args) {

  const packages = scanPackages();

  if (!Object.keys(packages).length) {
    console.log(`Can't find packages.`)
    process.exit(1)
  }

  if (packageName === 'all') {
    runInAllPackages(packages, command, args)
  } else {
    runInSinglePackage(packageName, packages, command, args)
  }
}

function runInAllPackages(packages, command, args) {
  const packageInfoList = Object.values(packages)
    .filter((value, idx, values) => values.indexOf(value) === idx);

  if (!packageInfoList.find(({ commands }) => commands.indexOf(command) !== -1)) {
    console.log(`Can't find command "${command}" in packages.\n`)
    process.exit(1)
  }

  const result = callScriptList(packageInfoList, command, args)
  process.exit(result)
}

function runInSinglePackage(packageName, packages, command, args) {

  const packageInfo = packages[packageName]

  if (!packageInfo) {

    console.log(`Can't find package with name: ${packageName}.\n`)

    selectPackage(packages).then(async ({ packageName }) => {
      const packageInfo = packages[packageName]

      const { command } = await selectCommand(packageInfo.commands)

      const result = callScript(packageInfo, command, args)
      process.exit(result)
    }).catch(handleError);
  } else if (packageInfo.commands.indexOf(command) === -1) {

    console.log(`Can't find command "${command}" in package with name: ${packageName}.\n`)

    selectCommand(packageInfo.commands).then(({ command }) => {
      const result = callScript(packageInfo, command, args)
      process.exit(result)
    }).catch(handleError);
  } else {
    const result = callScript(packageInfo, command, args)
    process.exit(result)
  }
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

module.exports = run;