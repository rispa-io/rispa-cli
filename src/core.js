const path = require('path')
const spawn = require('cross-spawn')
const fs = require('fs-extra')

const callScriptByYarn = (runPath, command, args) => (
  spawn.sync(
    'yarn',
    [command].concat(args),
    {
      cwd: runPath,
      stdio: 'inherit',
    }
  ).status
)

const callScriptByNpm = (runPath, command, args) => (
  spawn.sync(
    'npm',
    ['run', command].concat(args),
    {
      cwd: runPath,
      stdio: 'inherit',
    }
  ).status
)

const useYarn = (projectPath = process.cwd()) => fs.existsSync(path.resolve(projectPath, './yarn.lock'))

const callScript = (runPath, command, args) => useYarn() ?
  callScriptByYarn(runPath, command, args) :
  callScriptByNpm(runPath, command, args)

const callScriptList = (runPaths, command, args) => (
  runPaths.reduce((result, runPath) => callScript(runPath, command, args) || result, 0)
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

module.exports = {
  requireIfExist,
  handleError,
  callScriptByYarn,
  callScriptByNpm,
  callScript,
  callScriptList,
  useYarn,
}
