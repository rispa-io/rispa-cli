/* eslint-disable no-console, import/no-dynamic-require, global-require, no-shadow */

const { prompt } = require('inquirer')

const {
  handleError,
  callScript, callScriptList,
} = require('./core')
const scanPackages = require('./packages')

function selectPackage(packages) {
  return prompt([{
    type: 'list',
    name: 'packageName',
    message: 'Select available package:',
    paginated: true,
    choices: [...new Set(Object.keys(packages).map(key => packages[key].name))],
  }])
}

function selectCommand(commands) {
  return prompt([{
    type: 'list',
    name: 'command',
    message: 'Select available command:',
    paginated: true,
    choices: commands,
  }])
}

function runInAllPackages(packages, command, args) {
  const packageInfoList = Object.values(packages)
    .filter((value, idx, values) => values.indexOf(value) === idx)

  if (!packageInfoList.find(({ commands }) => commands.indexOf(command) !== -1)) {
    handleError(`Can't find command "${command}" in packages.\n`)
  }

  const result = callScriptList(packageInfoList, command, args)
  process.exit(result)
}

function runInSinglePackage(packageName, packages, command, args) {
  const packageInfo = packages[packageName]

  if (!packageInfo) {
    if (packageName) {
      console.log(`Can't find package with name: ${packageName}.\n`)
    }

    selectPackage(packages).then(async ({ packageName }) => {
      const packageInfo = packages[packageName]

      const { command } = await selectCommand(packageInfo.commands)

      const result = callScript(packageInfo, command, args)
      process.exit(result)
    }).catch(handleError)
  } else if (packageInfo.commands.indexOf(command) === -1) {
    console.log(`Can't find command "${command}" in package with name: ${packageName}.\n`)

    selectCommand(packageInfo.commands).then(({ command }) => {
      const result = callScript(packageInfo, command, args)
      process.exit(result)
    }).catch(handleError)
  } else {
    const result = callScript(packageInfo, command, args)
    process.exit(result)
  }
}

function run(packageName, command, ...args) {
  const packages = scanPackages()

  if (!Object.keys(packages).length) {
    handleError('Can\'t find packages.')
  }

  if (packageName === 'all') {
    runInAllPackages(packages, command, args)
  } else {
    runInSinglePackage(packageName, packages, command, args)
  }
}

module.exports = run
