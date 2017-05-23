const spawn = require('cross-spawn')

module.exports.cloneRepository = (cloneUrl, path) => (
  spawn.sync(
    'git',
    ['clone', cloneUrl],
    {
      cwd: path,
    }
  ).status
)
