const Listr = require('listr')
const chalk = require('chalk')
const { DEFAULT_PLUGIN_BRANCH, DEFAULT_PLUGIN_DEV_BRANCH } = require('../constants')
const { savePackageJson, publishToNpm } = require('../utils/plugin')
const {
  commit: gitCommit,
  push: gitPush,
  addTag: gitAddTag,
  merge: gitMerge,
  checkout: gitCheckout,
} = require('../utils/git')

const updateDepsToVersion = (dependencies, toUpdate, nextVersion) => (
  Object.entries(dependencies).reduce((result, [name, version]) =>
    Object.assign(result, {
      [name]: (
        toUpdate.indexOf(name) === -1 ? version : nextVersion
      ),
    }), {}
  )
)

const taskOf = (title, task) => ({ title, task })

const createUpdatePluginVersion = (name, path, packageInfo) => ({
  title: `Update ${chalk.cyan(name)} version`,
  task: () => new Listr([
    taskOf('Save package.json', () => savePackageJson(path, packageInfo)),
    taskOf('Commit version', () => gitCommit(path, `Version ${packageInfo.version}`)),
    taskOf('Add version tag', () => gitAddTag(path, `v${packageInfo.version}`)),
    taskOf('Push changes', () => gitPush(path)),
    taskOf('Switch to stable branch', () => gitCheckout(path, DEFAULT_PLUGIN_BRANCH)),
    taskOf('Merge master to stable', () => gitMerge(path, DEFAULT_PLUGIN_DEV_BRANCH)),
    taskOf('Push changes', () => gitPush(path)),
    taskOf('Switch to dev branch', () => gitCheckout(path, DEFAULT_PLUGIN_DEV_BRANCH)),
    taskOf('Publish to npm', () => publishToNpm(path)),
  ]),
})

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
    if (dependencies) {
      plugin.packageInfo.dependencies = updateDepsToVersion(
        dependencies, dependenciesToUpdate, nextVersion
      )
    }
    if (devDependencies) {
      plugin.packageInfo.devDependencies = updateDepsToVersion(
        devDependencies, dependenciesToUpdate, nextVersion
      )
    }
    if (peerDependencies) {
      plugin.packageInfo.peerDependencies = updateDepsToVersion(
        peerDependencies, dependenciesToUpdate, nextVersion
      )
    }

    return plugin
  })

  return new Listr(updatedPlugins.map(plugin =>
    createUpdatePluginVersion(plugin.name, plugin.path, plugin.packageInfo)
  ))
}

const updatePluginsVersion = {
  title: 'Update plugins version',
  task: updatePluginsVersionTask,
}

module.exports = updatePluginsVersion
