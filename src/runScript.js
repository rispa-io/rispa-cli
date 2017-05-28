const { prompt } = require('inquirer')

const {
  handleError,
  callScript, callScriptList,
} = require('./core')
const { scanPackages } = require('./packages')

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

async function runInAllPackages(packages, command, args) {
  const packageInfoList = Object.values(packages)
    .filter((value, idx, values) => values.indexOf(value) === idx)

  if (!packageInfoList.find(({ commands }) => commands.indexOf(command) !== -1)) {
    handleError(`Can't find command "${command}" in packages.`)
  }

  const result = callScriptList(packageInfoList, command, args)
  process.exit(result)
}

function callScriptInSinglePackage(packageInfo, command, args) {
  const result = callScript(packageInfo, command, args)
  process.exit(result)
}

async function runInSinglePackage(packageName, packages, command, args) {
  let packageInfo = packages[packageName]

  if (!packageInfo) {
    if (packageName) {
      console.log(`Can't find package with name: ${packageName}.\n`)
    }

    const { packageName: newPackageName } = await selectPackage(packages)
    packageInfo = packages[newPackageName]

    const { command: newCommand } = await selectCommand(packageInfo.commands)

    callScriptInSinglePackage(packageInfo, newCommand, args)
  } else if (packageInfo.commands.indexOf(command) === -1) {
    console.log(`Can't find command "${command}" in package with name: ${packageName}.\n`)

    const { command: newCommand } = await selectCommand(packageInfo.commands)

    callScriptInSinglePackage(packageInfo, newCommand, args)
  } else {
    callScriptInSinglePackage(packageInfo, command, args)
  }
}

async function run(packageName, command, ...args) {
  const packages = scanPackages()

  if (!Object.keys(packages).length) {
    handleError('Can\'t find packages.')
  }

  if (packageName === 'all') {
    await runInAllPackages(packages, command, args)
  } else {
    await runInSinglePackage(packageName, packages, command, args)
  }
}

module.exports = run
