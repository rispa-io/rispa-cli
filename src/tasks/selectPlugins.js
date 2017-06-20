const { prompt } = require('inquirer')

const promptPlugins = choices => prompt([{
  type: 'checkbox',
  message: 'Select plugins:',
  name: 'plugins',
  choices,
}])

const selectPluginsTask = async ctx => {
  const { excludePluginsNames = [] } = ctx
  const pluginsForSelect = ctx.plugins
    .filter(plugin => excludePluginsNames.indexOf(plugin.name) === -1)
    .map(plugin => ({
      name: plugin.name,
      value: plugin,
    }))

  return promptPlugins(pluginsForSelect).then(({ plugins }) => {
    ctx.selectedPlugins = plugins
  })
}

const selectPlugins = {
  title: 'Select plugins',
  task: selectPluginsTask,
}

module.exports = selectPlugins
