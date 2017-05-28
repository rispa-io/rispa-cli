const spawn = require('cross-spawn')

const cloneRepository = (cloneUrl, path) => (
  spawn.sync(
    'git',
    ['clone', cloneUrl],
    {
      cwd: path,
      stdio: 'inherit',
    }
  ).status
)

const pullRepository = path => (
  spawn.sync(
    'git',
    ['pull'],
    {
      cwd: path,
      stdio: 'inherit',
    }
  ).status
)

const resetRepository = path => (
  spawn.sync(
    'git',
    ['reset', '--hard', 'origin/master'],
    {
      cwd: path,
      stdio: 'inherit',
    }
  ).status
)

module.exports = {
  cloneRepository, pullRepository, resetRepository,
}
