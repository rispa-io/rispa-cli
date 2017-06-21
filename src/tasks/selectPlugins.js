const { prompt } = require('inquirer')

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
    .map(plugin => ({
      name: typeof plugin === 'object' ? plugin.name : plugin,
      value: plugin,
    }))
    .filter(plugin => excludePluginsNames.indexOf(plugin.name) === -1)

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
