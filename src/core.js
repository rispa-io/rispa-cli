/* eslint-disable no-console, import/no-dynamic-require, global-require */

const path = require('path')
const spawn = require('cross-spawn')
const fs = require('fs')

const PROJECT_PATH = process.cwd()
const USE_YARN = fs.existsSync(path.resolve(PROJECT_PATH, './yarn.lock'))

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
    return null
  }
}

const handleError = error => {
  console.error(error)
  process.exit(1)
}

const callScript = USE_YARN ? callScriptByYarn : callScriptByNpm

const callScriptList = (packageInfoList, command, args) => (
  packageInfoList.reduce((result, packageInfo) => callScript(packageInfo, command, args) || result, 0)
)

module.exports = {
  requireIfExist, handleError, callScriptByYarn, callScriptByNpm, callScript, callScriptList,
}
