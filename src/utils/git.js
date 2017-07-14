const spawn = require('cross-spawn')
const { DEFAULT_PLUGIN_BRANCH, DEFAULT_PLUGIN_DEV_BRANCH } = require('../constants')

const REMOTE_REGEXP = /([^\s]+)\s+([^\s]+)\s+\((\w+)\)/g

const defaultSpawnOptions = cwd => ({ cwd, stdio: 'inherit' })

const cloneRepository = (path, cloneUrl, { ref = DEFAULT_PLUGIN_DEV_BRANCH, depth } = {}) => {
  const options = ['--branch', ref]

  if (depth) {
    options.push('--depth')
    options.push(depth)
  }

  const result = spawn.sync(
    'git',
    ['clone', cloneUrl].concat(options),
    defaultSpawnOptions(path)
  )

  if (result.status !== 0) {
    throw new Error('Can\'t clone repository')
  }

  return result
}

const pullRepository = path => {
  const result = spawn.sync(
    'git',
    ['pull'],
    defaultSpawnOptions(path)
  )

  if (result.status !== 0) {
    throw new Error('Failed git pull changes')
  }

  return result
}

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

const getRemotes = path => {
  const result = spawn.sync(
    'git',
    ['remote', '-v'],
    { cwd: path, stdio: 'pipe' }
  )

  if (result.status === 1) {
    throw new Error('Can\'t get remotes')
  }

  const output = String(result.output[1])
  const remotes = {}

  let match = REMOTE_REGEXP.exec(output)
  while (match) {
    const [, remoteName, remoteUrl, action] = match
    if (!remotes[remoteName]) {
      remotes[remoteName] = {}
    }
    remotes[remoteName][action] = remoteUrl
    match = REMOTE_REGEXP.exec(output)
  }

  return remotes
}

const addSubtree = (path, prefix, remoteName, remoteUrl, ref = DEFAULT_PLUGIN_BRANCH) => {
  if (!addRemote(path, remoteName, remoteUrl)) {
    throw new Error('Failed add remote url')
  }

  const result = spawn.sync(
    'git',
    ['subtree', 'add', `--prefix=${prefix}`, remoteName, ref],
    defaultSpawnOptions(path)
  )

  if (result.status !== 0) {
    throw new Error('Failed add subtree')
  }

  return result
}

const updateSubtree = (path, prefix, remoteName, remoteUrl, ref = DEFAULT_PLUGIN_BRANCH) => (
  removeRemote(path, remoteName) &&
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
  const success = spawn.sync('git', ['add', '.'], options).status === 0 &&
    spawn.sync('git', ['commit', '-m', message], options).status === 0

  if (!success) {
    throw new Error('Failed git commit')
  }
}

const push = path => {
  const result = spawn.sync(
    'git',
    ['push'],
    defaultSpawnOptions(path)
  )

  if (result.status !== 0) {
    throw new Error('Failed git push')
  }

  return result
}

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
  const success = spawn.sync('git', ['tag', tag], spawnOptions).status === 0 &&
    spawn.sync('git', ['push', '--tags'], spawnOptions).status === 0

  if (!success) {
    throw new Error('Failed git add tag')
  }
}

const checkout = (path, branch) => {
  const spawnOptions = defaultSpawnOptions(path)
  const result = spawn.sync('git', ['checkout', branch], spawnOptions)
  if (result.status !== 0) {
    throw new Error('Failed git checkout')
  }

  return result
}

const merge = (path, branch) => {
  const spawnOptions = defaultSpawnOptions(path)
  const result = spawn.sync('git', ['merge', branch], spawnOptions)
  if (result.status !== 0) {
    throw new Error('Failed git merge')
  }

  return result
}

const clean = path => {
  const spawnOptions = defaultSpawnOptions(path)
  const result = spawn.sync('git', ['clean', '-df'], spawnOptions)
  if (result.status !== 0) {
    throw new Error('Failed git clean')
  }

  checkout(path, '.')
}

module.exports = {
  cloneRepository,
  pullRepository,
  addSubtree,
  updateSubtree,
  init,
  commit,
  push,
  addRemote,
  removeRemote,
  getRemotes,
  getChanges,
  tagInfo,
  addTag,
  checkout,
  merge,
  clean,
}
