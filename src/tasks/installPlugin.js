const path = require('path')
const { cyan } = require('chalk')
const { improveTask } = require('../utils/tasks')
const { DEV_MODE } = require('../constants')
const {
  addSubtree: gitAddSubtree,
  cloneRepository: gitCloneRepository,
} = require('../utils/git')

const checkCloneUrl = cloneUrl => {
  if (!cloneUrl.endsWith('.git')) {
    throw new Error(`Invalid plugin remote url ${cyan(cloneUrl)}`)
  }
}

const createInstallPlugin = (name, cloneUrl, ref) => improveTask({
  title: `Install plugin with name ${cyan(name)}`,
  skip: ({ configuration: { plugins } }) => plugins.indexOf(name) !== -1 && 'Plugin already installed',
  before: ctx => {
    if (!ctx.installedPlugins) {
      ctx.installedPlugins = []
    }
  },
  task: ctx => {
    const { projectPath } = ctx
    const pluginsPath = ctx.pluginsPath || path.resolve(projectPath, ctx.configuration.pluginsPath)
    const mode = ctx.mode || ctx.configuration.mode

    checkCloneUrl(cloneUrl)

    if (mode === DEV_MODE) {
      gitCloneRepository(pluginsPath, cloneUrl)
    } else {
      const pluginsRelPath = path.relative(projectPath, pluginsPath)
      const prefix = `${pluginsRelPath}/${name}`
      gitAddSubtree(projectPath, prefix, name, cloneUrl, ref)
    }

    ctx.pluginsPath = pluginsPath
    ctx.installedPlugins.push(name)
    ctx.configuration.plugins.push(name)
    ctx.configuration.remotes[name] = cloneUrl
  },
})

module.exports = createInstallPlugin
