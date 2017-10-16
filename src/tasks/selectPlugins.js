const { prompt } = require('inquirer')
const { getPluginName, equalPluginName } = require('../utils/plugin')

const promptPlugins = choices => prompt([{
  type: 'checkbox',
  message: 'Select plugins:',
  name: 'selectedPlugins',
  choices,
}])

const selectPluginsTask = ctx => {
  const { excludePluginsNames = [] } = ctx
  const plugins = ctx.plugins || ctx.configuration.plugins

  const pluginsForSelect = plugins
    .filter(plugin =>
      !excludePluginsNames.some(pluginName => equalPluginName(pluginName, plugin))
    )
    .map(plugin => ({
      name: getPluginName(plugin),
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
