const githubApi = require('../utils/githubApi')

const fetchPluginsTask = async ctx => {
  const { data: { items: plugins } } = await githubApi.plugins()

  ctx.plugins = plugins
}

const fetchPlugins = {
  title: 'Fetch plugins',
  enabled: ctx => !ctx.plugins,
  task: fetchPluginsTask,
}

module.exports = fetchPlugins
