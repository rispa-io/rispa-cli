const Listr = require('listr')
const { prompt } = require('inquirer')
const chalk = require('chalk')
const { DEFAULT_PLUGIN_BRANCH, DEFAULT_PLUGIN_DEV_BRANCH } = require('../constants')
const { savePackageJson, publishToNpm } = require('../utils/plugin')
const {
  commit: gitCommit,
  push: gitPush,
  addTag: gitAddTag,
  merge: gitMerge,
  checkout: gitCheckout,
  pullRepository: gitPull,
  pushTags: gitPushTags,
} = require('../utils/git')

const askWantToPublish = name => prompt([{
  type: 'publish',
  name: 'publish',
  message: `Want to publish ${chalk.cyan(name)}?`,
  default: false,
}])

const updateDepsToVersion = (dependencies, toUpdate, nextVersion) => (
  Object.entries(dependencies).reduce((result, [name, version]) =>
    Object.assign(result, {
      [name]: (
        toUpdate.indexOf(name) === -1 ? version : nextVersion
      ),
    }), {}
  )
)

const chainPlugins = (name, mapper) =>
  plugins => ({
    title: name,
    task: () => new Listr(
      plugins.map(plugin => ({
        title: chalk.cyan(plugin.name),
        task: mapper(plugin),
      }))
    ),
  })

const createSavePackage = chainPlugins(
  'Save package.json',
  ({ path, packageInfo }) =>
    () => savePackageJson(path, packageInfo)
)

const createCommitVersion = chainPlugins(
  'Commit version',
  ({ path, packageInfo }) =>
    () => gitCommit(path, `Version ${packageInfo.version}`)
)

const createAddVersionTag = chainPlugins(
  'Add version tag',
  ({ path, packageInfo }) =>
    () => gitAddTag(path, `v${packageInfo.version}`)
)

const createPublishToNpm = chainPlugins(
  'Publish to npm',
  ({ name, path }) =>
    () => askWantToPublish(name)
      .then(({ publish }) => {
        if (publish) {
          publishToNpm(path)
        }
      })
)

const createPushChanges = chainPlugins(
  'Push changes',
  ({ path }) =>
    () => {
      gitPushTags(path)
      gitPush(path)
    }
)

const createSwitchToStableBranch = chainPlugins(
  'Switch to stable branch',
  ({ path }) =>
    () => {
      gitCheckout(path, DEFAULT_PLUGIN_BRANCH)
      gitPull(path)
    }
)

const createMergeMasterToStable = chainPlugins(
  'Merge master to stable',
  ({ path }) =>
    () => gitMerge(path, DEFAULT_PLUGIN_DEV_BRANCH)
)

const createSwitchToDevBranch = chainPlugins(
  'Switch to dev branch',
  ({ path }) =>
    () => gitCheckout(path, DEFAULT_PLUGIN_DEV_BRANCH)
)

const performDepsVersion = version => {
  const [major, minor] = version.split('.')

  return `${major}.${minor}.x`
}

const updatePluginsVersionTask = ctx => {
  const { nextVersion, plugins } = ctx

  const dependenciesToUpdate = plugins.map(plugin => plugin.packageInfo.name)

  const updatedPlugins = plugins.map(plugin => {
    const {
      packageInfo: {
        dependencies, devDependencies, peerDependencies,
      },
    } = plugin

    plugin.packageInfo.version = nextVersion

    const depsVersion = performDepsVersion(nextVersion)
    if (dependencies) {
      plugin.packageInfo.dependencies = updateDepsToVersion(
        dependencies, dependenciesToUpdate, depsVersion
      )
    }
    if (devDependencies) {
      plugin.packageInfo.devDependencies = updateDepsToVersion(
        devDependencies, dependenciesToUpdate, depsVersion
      )
    }
    if (peerDependencies) {
      plugin.packageInfo.peerDependencies = updateDepsToVersion(
        peerDependencies, dependenciesToUpdate, depsVersion
      )
    }

    return plugin
  })

  return new Listr([
    createSavePackage(updatedPlugins),
    createCommitVersion(updatedPlugins),
    createAddVersionTag(updatedPlugins),
    createPublishToNpm(updatedPlugins),
    createPushChanges(updatedPlugins),
    createSwitchToStableBranch(updatedPlugins),
    createMergeMasterToStable(updatedPlugins),
    createPushChanges(updatedPlugins),
    createSwitchToDevBranch(updatedPlugins),
  ])
}

const updatePluginsVersion = {
  title: 'Update plugins version',
  task: updatePluginsVersionTask,
}

module.exports = updatePluginsVersion
