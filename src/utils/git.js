const spawn = require('cross-spawn')
const { DEFAULT_PLUGIN_BRANCH, DEFAULT_PLUGIN_DEV_BRANCH } = require('../constants')

const defaultSpawnOptions = cwd => ({ cwd, stdio: 'inherit' })

const cloneRepository = (path, cloneUrl, ref = DEFAULT_PLUGIN_DEV_BRANCH) => (
  spawn.sync(
    'git',
    ['clone', '--branch', ref, cloneUrl],
    defaultSpawnOptions(path)
  ).status === 0
)

const pullRepository = path => (
  spawn.sync(
    'git',
    ['pull'],
    defaultSpawnOptions(path)
  ).status === 0
)

const addRemote = (path, remoteName, remoteUrl) => (
  spawn.sync(
    'git',
    ['remote', 'add', remoteName, remoteUrl],
    defaultSpawnOptions(path)
  ).status === 0
)

const removeRemote = (path, remoteName) => (
  spawn.sync(
    'git',
    ['remote', 'rm', remoteName],
    defaultSpawnOptions(path)
  ).status === 0
)

const addSubtree = (path, prefix, remoteName, remoteUrl, ref = DEFAULT_PLUGIN_BRANCH) => (
  addRemote(path, remoteName, remoteUrl) &&
  spawn.sync(
    'git',
    ['subtree', 'add', `--prefix=${prefix}`, remoteName, ref],
    defaultSpawnOptions(path)
  ).status === 0
)

const updateSubtree = (path, prefix, remoteName, remoteUrl, ref = DEFAULT_PLUGIN_BRANCH) => (
  addRemote(path, remoteName, remoteUrl) &&
  spawn.sync(
    'git',
    ['subtree', 'pull', `--prefix=${prefix}`, remoteName, ref],
    defaultSpawnOptions(path)
  ).status === 0
)

const init = (path, remoteUrl) => {
  let success = spawn.sync(
    'git',
    ['init'],
    defaultSpawnOptions(path)
  ).status === 0

  if (success && remoteUrl) {
    success = addRemote(path, 'origin', remoteUrl)
  }
  return success
}

const commit = (path, message) => {
  const options = defaultSpawnOptions(path)
  return spawn.sync('git', ['add', '.'], options).status === 0 &&
    spawn.sync('git', ['commit', '-m', message], options).status === 0
}

const push = path => (
  spawn.sync(
    'git',
    ['push'],
    defaultSpawnOptions(path)
  ).status === 0
)

const getChanges = path => {
  const result = spawn.sync(
    'git',
    ['status', '--porcelain'],
    {
      cwd: path,
      stdio: 'pipe',
    }
  )

  return result.status === 0 && String(result.output[1])
}

const getLastTagDescription = path => (
  spawn.sync(
    'git',
    ['describe', '--tags', '--long', '--match', 'v*'],
    {
      cwd: path,
      stdio: 'pipe',
    }
  )
)

const tagInfo = path => {
  const result = getLastTagDescription(path)
  const tagDescription = result.status !== 1 && String(result.output[1])
  if (!tagDescription) {
    return null
  }

  const parts = /v((\d+).(\d+).(\d+))-(\d+)-\w+/.exec(tagDescription)
  const [version, major, minor, patch, newCommitsCount] = parts.slice(1)

  return {
    version,
    versionParts: {
      major,
      minor,
      patch,
    },
    newCommitsCount,
  }
}

const addTag = (path, tag) => {
  const spawnOptions = defaultSpawnOptions(path)
  return spawn.sync('git', ['tag', tag], spawnOptions).status === 0 &&
    spawn.sync('git', ['push', '--tags'], spawnOptions).status === 0
}

module.exports = {
  cloneRepository,
  pullRepository,
  addSubtree,
  updateSubtree,
  init,
  commit,
  push,
  removeRemote,
  getChanges,
  tagInfo,
  addTag,
}
