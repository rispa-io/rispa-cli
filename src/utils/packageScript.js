const spawn = require('cross-spawn')

const callPluginScriptByYarn = (runPath, scriptName, args) => (
  spawn(
    'yarn',
    [scriptName].concat(args),
    {
      cwd: runPath,
      stdio: 'inherit',
    }
  )
)

const callPluginScriptByNpm = (runPath, scriptName, args) => (
  spawn(
    'npm',
    ['run', scriptName].concat(args),
    {
      cwd: runPath,
      stdio: 'inherit',
    }
  )
)

const createCallPluginScript = useYarn => useYarn ? callPluginScriptByYarn : callPluginScriptByNpm

module.exports = {
  callPluginScriptByYarn,
  callPluginScriptByNpm,
  createCallPluginScript,
}
