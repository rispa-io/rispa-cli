const spawn = require('cross-spawn')
const { scanPackages } = require('../packages')
const { prompt } = require('inquirer')

const gitGetLastTagDescription = path => (
  spawn.sync(
    'git',
    ['describe', '--tags', '--long', '--match', 'v*'],
    {
      cwd: path,
      stdio: 'pipe',
    }
  )
)

const gitAddTag = (path, tag) => {
  const spawnOptions = {
    cwd: path,
    stdio: 'inherit',
  }
  spawn.sync('git', ['tag', tag], spawnOptions)
  spawn.sync('git', ['push', '--tags'], spawnOptions)
}

const selectNextVersion = versions => prompt([{
  type: 'list',
  name: 'nextVersion',
  choices: versions,
  message: 'Select next version:',
}])

const getTagInfo = path => {
  const result = gitGetLastTagDescription(path)
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

const getPackages = () => {
  const packages = scanPackages()
  return Object.keys(packages)
    .map(name => packages[name])
    .filter((item, index, arr) => arr.indexOf(item) === index)
}

const updateVersion = async ({ name, path, tagInfo }) => {
  const { newCommitsCount, version, versionParts } = tagInfo

  console.log(`${newCommitsCount} new commit(s) for plugin '${name}' after ${version}`)

  const { major, minor, patch } = versionParts
  const versions = {
    PATCH: `${major}.${minor}.${+patch + 1}`,
    MINOR: `${major}.${+minor + 1}.0`,
    MAJOR: `${+major + 1}.0.0`,
  }
  const choices = Object.keys(versions).map(versionName => ({
    name: `${versionName} ${versions[versionName]}`,
    value: versions[versionName],
  }))
  const nextVersion = (await selectNextVersion(choices)).nextVersion
  gitAddTag(path, `v${nextVersion}`)
}

const processQueue = async (queue, func) => {
  const next = queue.pop()
  if (next) {
    await func(next)
    await processQueue(queue, func)
  }
}

const command = async () => {
  const packages = getPackages()

  const queue = []
  packages.forEach(({ name, path }) => {
    const tagInfo = getTagInfo(path)
    if (!tagInfo) {
      console.log(`No version tag found for ${name}`)
    } else if (tagInfo.newCommitsCount > 0) {
      queue.push({
        name,
        path,
        tagInfo,
      })
    }
  })

  if (queue.length) {
    await processQueue(queue, updateVersion)
  } else {
    console.log('No plugins to be numerated')
  }
}

module.exports = command
