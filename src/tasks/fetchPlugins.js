const githubApi = require('../utils/githubApi')
const { checkMode } = require('../utils/tasks')
const { DEFAULT_PLUGIN_BRANCH, DEFAULT_PLUGIN_DEV_BRANCH, PLUGIN_ALIAS, DEV_MODE, TEST_MODE } = require('../constants')

const fillPlugin = (plugin, packageJson) => Object.assign({}, plugin, {
  packageName: packageJson.name,
  packageAlias: packageJson[PLUGIN_ALIAS],
  packageVersion: packageJson.version,
})

const fetchPluginsTask = ctx => {
  const branch = checkMode(ctx, DEV_MODE, TEST_MODE) ? DEFAULT_PLUGIN_DEV_BRANCH : DEFAULT_PLUGIN_BRANCH

  const mapPlugin = plugin => (
    githubApi.pluginPackageJson(plugin.name, branch)
      .then(
        packageJson => fillPlugin(plugin, packageJson),
        () => plugin
      )
  )

  return githubApi.plugins()
    .then(plugins =>
      Promise.all(plugins.map(mapPlugin))
    )
    .then(plugins => {
      ctx.plugins = plugins

      return githubApi.pluginsExtendable()
    })
    .then(pluginsExtendable => {
      ctx.plugins = ctx.plugins.map(plugin => Object.assign(plugin, {
        extendable: pluginsExtendable.indexOf(plugin.name) !== -1,
      }))
    })
}

const fetchPlugins = {
  title: 'Fetch plugins',
  enabled: ctx => !ctx.plugins,
  task: fetchPluginsTask,
}

module.exports = fetchPlugins
