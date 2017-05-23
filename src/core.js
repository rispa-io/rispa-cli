/* eslint-disable no-console, import/no-dynamic-require, global-require */

const spawn = require('cross-spawn')
const fs = require('fs')

const USE_YARN = fs.existsSync('./yarn.lock')

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

const requireIfExist = id => {
  try {
    return require(id)
  } catch (e) {
    if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
      return null
    }
    throw e
  }
}

const handleError = error => {
  console.log(error)
  process.exit(1)
}

const callScript = USE_YARN ? callScriptByYarn : callScriptByNpm

const callScriptList = (packageInfoList, command, args) => (
  packageInfoList.reduce((result, packageInfo) => callScript(packageInfo, command, args) || result, 0)
)

module.exports = {
  requireIfExist, handleError, callScript, callScriptList,
}
