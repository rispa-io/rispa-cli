const githubApi = require('../utils/githubApi')

const fetchPluginsTask = ctx => githubApi.plugins()
  .then(({ data: { items: plugins } }) => {
    ctx.plugins = plugins
  })

const fetchPlugins = {
  title: 'Fetch plugins',
  enabled: ctx => !ctx.plugins,
  task: fetchPluginsTask,
}

module.exports = fetchPlugins
