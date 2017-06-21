const path = require('path')
const { addSubtree, cloneRepository } = require('../utils/git')
const { improveTask } = require('../utils/tasks')

const checkCloneUrl = cloneUrl => {
  if (!cloneUrl.endsWith('.git')) {
    throw new Error(`Invalid plugin remote url '${cloneUrl}'`)
  }
}

const createInstallPlugin = (name, cloneUrl) => improveTask({
  title: `Install plugin with name '${name}'`,
  before: ctx => {
    if (!ctx.configuration) {
      throw new Error('Can\'t find project configuration')
    }

    if (!ctx.installedPlugins) {
      ctx.installedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)
    const mode = ctx.mode || ctx.configuration.mode

    checkCloneUrl(cloneUrl)

    if (mode === 'dev') {
      cloneRepository(pluginsPath, cloneUrl)
    } else {
      const pluginsRelPath = path.relative(projectPath, pluginsPath)
      const prefix = `${pluginsRelPath}/${name}`
      addSubtree(projectPath, prefix, name, cloneUrl)
    }

    ctx.installedPlugins.push(name)
    ctx.configuration.plugins.push(name)
    ctx.configuration.remotes[name] = cloneUrl
  },
})

module.exports = createInstallPlugin
