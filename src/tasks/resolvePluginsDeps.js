const Listr = require('listr')
const path = require('path')
const { readDependencies, parseDependencyVersion } = require('../utils/plugin')
const { PLUGIN_PREFIX } = require('../constants')
const createInstallPlugin = require('../tasks/installPlugin')

const pluginsDependencies = (pluginsPath, plugins) => (
  Object.entries(
    plugins.reduce((deps, plugin) => Object.assign(
      deps, readDependencies(path.resolve(pluginsPath, `./${plugin.name}`))
    ), {})
  ).filter(([name]) => name.startsWith(PLUGIN_PREFIX))
    .map(([name, dependencyVersion]) => ({
      name,
      ref: parseDependencyVersion(dependencyVersion),
    }))
)

const resolvePluginsDeps = {
  title: 'Resolve plugins dependencies',
  skip: ctx => (!ctx.installedPlugins || !ctx.installedPlugins.length) && 'Plugins not added',
  task: ctx => {
    const { configuration, projectPath, plugins, installedPlugins } = ctx
    const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)

    const pluginsForResolve = plugins.filter(plugin => installedPlugins.indexOf(plugin.name) !== -1)

    const installPlugins = pluginsDependencies(pluginsPath, pluginsForResolve)
      .reduce((result, { name, ref }) => {
        const plugin = plugins.find(currentPlugin => currentPlugin.packageName === name)
        if (plugin && plugin.extendable) {
          result.push(createInstallPlugin(Object.assign({}, plugin, { ref })))
        }
        return result
      }, [])

    return new Listr(installPlugins, { exitOnError: false })
  },
}

module.exports = resolvePluginsDeps
