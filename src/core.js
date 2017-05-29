const path = require('path')
const spawn = require('cross-spawn')
const fs = require('fs-extra')

const callScriptByYarn = (packageInfo, command, args) => (
  spawn.sync(
    'yarn',
    [command].concat(args),
    {
      cwd: packageInfo.path,
      stdio: 'inherit',
    }
  ).status
)

const callScriptByNpm = (packageInfo, command, args) => (
  spawn.sync(
    'npm',
    ['run', command].concat(args),
    {
      cwd: packageInfo.path,
      stdio: 'inherit',
    }
  ).status
)

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

const useYarn = (projectPath = process.cwd()) => fs.existsSync(path.resolve(projectPath, './yarn.lock'))

const callScript = (packageInfo, command, args) => useYarn() ?
  callScriptByYarn(packageInfo, command, args) :
  callScriptByNpm(packageInfo, command, args)

const callScriptList = (packageInfoList, command, args) => (
  packageInfoList.reduce((result, packageInfo) => callScript(packageInfo, command, args) || result, 0)
)

module.exports = {
  requireIfExist,
  handleError,
  callScriptByYarn,
  callScriptByNpm,
  callScript,
  callScriptList,
  useYarn,
}
