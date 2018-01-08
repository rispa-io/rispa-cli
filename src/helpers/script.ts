import spawn = require('cross-spawn')

export const runPackageScript = (cwd: string, scriptName: string, args: string[], stdio = 'inherit') => (
  spawn.sync(
    'yarn',
    [scriptName].concat(args),
    {
      cwd,
      stdio,
    },
  ).status
)
