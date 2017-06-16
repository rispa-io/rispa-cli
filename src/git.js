const spawn = require('cross-spawn')

const defaultSpawnOptions = cwd => ({ cwd, stdio: 'inherit' })

const cloneRepository = (cloneUrl, path) => (
  spawn.sync(
    'git',
    ['clone', cloneUrl],
    defaultSpawnOptions(path)
  ).status
)

const pullRepository = path => (
  spawn.sync(
    'git',
    ['pull'],
    defaultSpawnOptions(path)
  ).status
)

const resetRepository = path => (
  spawn.sync(
    'git',
    ['reset', '--hard', 'origin/master'],
    defaultSpawnOptions(path)
  ).status
)

const addSubtree = (path, prefix, remoteName, remoteUrl) => {
  spawn.sync(
    'git',
    ['remote', 'add', remoteName, remoteUrl],
    defaultSpawnOptions(path)
  )
  spawn.sync(
    'git',
    ['subtree', 'add', `--prefix=${prefix}`, remoteName, 'master'],
    defaultSpawnOptions(path)
  )
}

const init = (path, remoteUrl) => {
  const options = defaultSpawnOptions(path)
  spawn.sync('git', ['init'], options)
  if (remoteUrl) {
    spawn.sync('git', ['remote', 'add', 'origin', remoteUrl], options)
  }
}

const commit = (path, message) => {
  const options = defaultSpawnOptions(path)
  spawn.sync('git', ['add', '.'], options)
  spawn.sync('git', ['commit', '-m', message], options)
}

module.exports = {
  cloneRepository,
  pullRepository,
  resetRepository,
  addSubtree,
  init,
  commit,
}
