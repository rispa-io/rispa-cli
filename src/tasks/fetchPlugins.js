const githubApi = require('../utils/githubApi')

const mapGithubPlugin = ({ name, clone_url: cloneUrl }) => ({ name, cloneUrl })

const fetchPluginsTask = ctx => githubApi.plugins()
  .then(({ data: { items: plugins } }) => {
    ctx.plugins = plugins.map(mapGithubPlugin)
  })

const fetchPlugins = {
  title: 'Fetch plugins',
  enabled: ctx => !ctx.plugins,
  task: fetchPluginsTask,
}

module.exports = fetchPlugins
