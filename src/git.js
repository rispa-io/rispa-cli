const spawn = require('cross-spawn')

const cloneRepository = (cloneUrl, path) => (
  spawn.sync(
    'git',
    ['clone', cloneUrl],
    {
      cwd: path,
    }
  ).status
)

const pullRepository = path => (
  spawn.sync(
    'git',
    ['pull'],
    {
      cwd: path,
    }
  ).status
)

const resetRepository = path => (
  spawn.sync(
    'git',
    ['reset', '--hard', 'origin/master'],
    {
      cwd: path,
    }
  ).status
)

module.exports = {
  cloneRepository, pullRepository, resetRepository,
}
