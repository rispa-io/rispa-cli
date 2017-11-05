const { prompt } = require('inquirer')
const chalk = require('chalk')
const { getPluginName, equalPluginName } = require('../utils/plugin')

const promptPlugins = choices => prompt([{
  type: 'checkbox',
  message: 'Select plugins:',
  name: 'selectedPlugins',
  choices,
}])

const prepareName = plugin => {
  const version = plugin.packageVersion
  const description = plugin.packageDescription

  return `${getPluginName(plugin)}${chalk.green(version ? ` v${version}` : '')}${chalk.gray(description ? ` - ${description}` : '')}`
}

const selectPluginsTask = ctx => {
  const { excludePluginsNames = [] } = ctx
  const plugins = ctx.plugins || ctx.configuration.plugins

  const pluginsForSelect = plugins
    .filter(plugin =>
      !excludePluginsNames.some(pluginName => equalPluginName(pluginName, plugin))
    )
    .map(plugin => ({
      name: prepareName(plugin),
      value: plugin,
    }))

  if (pluginsForSelect.length === 0) {
    throw new Error('Can\'t find plugins for select')
  }

  return promptPlugins(pluginsForSelect).then(({ selectedPlugins }) => {
    ctx.selectedPlugins = selectedPlugins
  })
}

const selectPlugins = {
  title: 'Select plugins',
  task: selectPluginsTask,
}

module.exports = selectPlugins
