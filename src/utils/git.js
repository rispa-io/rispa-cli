const spawn = require('cross-spawn')

const defaultSpawnOptions = cwd => ({ cwd, stdio: 'inherit' })

const cloneRepository = (path, cloneUrl) => (
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

const addRemote = (path, remoteName, remoteUrl) => {
  spawn.sync(
    'git',
    ['remote', 'add', remoteName, remoteUrl],
    defaultSpawnOptions(path)
  )
}

const removeRemote = (path, remoteName) => {
  spawn.sync(
    'git',
    ['remote', 'rm', remoteName],
    defaultSpawnOptions(path)
  )
}

const addSubtree = (path, prefix, remoteName, remoteUrl) => {
  addRemote(path, remoteName, remoteUrl)
  spawn.sync(
    'git',
    ['subtree', 'add', `--prefix=${prefix}`, remoteName, 'master'],
    defaultSpawnOptions(path)
  )
}

const updateSubtree = (path, prefix, remoteName, remoteUrl) => {
  addRemote(path, remoteName, remoteUrl)
  spawn.sync(
    'git',
    ['subtree', 'pull', `--prefix=${prefix}`, remoteName, 'master'],
    defaultSpawnOptions(path)
  )
}

const init = (path, remoteUrl) => {
  const options = defaultSpawnOptions(path)
  spawn.sync('git', ['init'], options)
  if (remoteUrl) {
    addRemote(path, 'origin', remoteUrl)
  }
}

const commit = (path, message) => {
  const options = defaultSpawnOptions(path)
  return spawn.sync('git', ['add', '.'], options).status === 0
    && spawn.sync('git', ['commit', '-m', message], options).status === 0
}

const push = path => (
  spawn.sync('git', ['push'], defaultSpawnOptions(path)).status === 0
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
  if (!parts) {
    return null
  }

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
  const spawnOptions = {
    cwd: path,
    stdio: 'inherit',
  }

  return spawn.sync('git', ['tag', tag], spawnOptions).status === 0
    && spawn.sync('git', ['push', '--tags'], spawnOptions).status === 0
}

module.exports = {
  cloneRepository,
  pullRepository,
  resetRepository,
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
