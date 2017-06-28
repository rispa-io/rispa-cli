const path = require('path')
const { cyan } = require('chalk')
const { improveTask, checkDevMode, checkTestMode } = require('../utils/tasks')
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

    checkCloneUrl(cloneUrl)

    if (checkDevMode(ctx)) {
      gitCloneRepository(pluginsPath, cloneUrl)
    } else if (checkTestMode(ctx)) {
      gitCloneRepository(pluginsPath, cloneUrl, { depth: 1 })
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
