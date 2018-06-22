const spawn = require('cross-spawn')

const callPluginScriptByYarn = (runPath, scriptName, args) => (
  spawn.sync(
    'yarn',
    [scriptName].concat(args),
    {
      cwd: runPath,
      stdio: 'inherit',
      env: process.env,
    }
  ).status
)

const callPluginScriptByNpm = (runPath, scriptName, args) => (
  spawn.sync(
    'npm',
    ['run', scriptName].concat(args),
    {
      cwd: runPath,
      stdio: 'inherit',
      env: process.env,
    }
  ).status
)

const createCallPluginScript = useYarn => useYarn ? callPluginScriptByYarn : callPluginScriptByNpm

module.exports = {
  callPluginScriptByYarn,
  callPluginScriptByNpm,
  createCallPluginScript,
}
