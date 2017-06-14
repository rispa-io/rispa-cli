const spawn = require('cross-spawn')
const { scanPackages } = require('../packages')
const { prompt } = require('inquirer')

const gitStatus = path => (
  spawn.sync(
    'git',
    ['status', '--porcelain'],
    {
      cwd: path,
      stdio: 'pipe',
    }
  )
)

const gitCommitAndPush = (path, message) => {
  const spawnOptions = {
    cwd: path,
    stdio: 'inherit',
  }
  spawn.sync('git', ['add', '.'], spawnOptions)
  spawn.sync('git', ['commit', '-m', message], spawnOptions)
  spawn.sync('git', ['push'], spawnOptions)
}

const enterCommitMessage = () => prompt([{
  type: 'input',
  name: 'commitMessage',
  message: 'Enter commit message (leave empty to skip):',
}])

const getChanges = path => {
  const result = gitStatus(path)
  return result.status !== 1 && String(result.output[1])
}

const getPackages = () => {
  const packages = scanPackages()
  return Object.keys(packages)
    .map(name => packages[name])
    .filter((item, index, arr) => arr.indexOf(item) === index)
}

const logChanges = (pluginName, changes) => {
  console.log(`Changes for plugin '${pluginName}':`)
  console.log(changes)
}

const processChanges = async ({ name, path, changes }) => {
  logChanges(name, changes)
  const commitMessage = (await enterCommitMessage()).commitMessage
  if (commitMessage) {
    gitCommitAndPush(path, commitMessage)
  }
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
    const changes = getChanges(path)
    if (changes) {
      queue.push({
        name,
        path,
        changes,
      })
    }
  })

  if (queue.length) {
    await processQueue(queue, processChanges)
  } else {
    console.log('Nothing to commit')
  }
}

module.exports = command
