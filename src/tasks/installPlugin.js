const path = require('path')
const { addSubtree, cloneRepository } = require('../utils/git')

const checkCloneUrl = cloneUrl => {
  if (!cloneUrl.endsWith('.git')) {
    throw new Error(`Invalid plugin remote url '${cloneUrl}'`)
  }
}

const createInstallPlugin = (name, cloneUrl) => ({
  title: `Install plugin with name '${name}'`,
  task: ctx => {
    if (!ctx.configuration) {
      throw new Error('Can\'t find project configuration')
    }

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

    ctx.configuration.plugins.push(name)
    ctx.configuration.remotes[name] = cloneUrl
  },
})

module.exports = createInstallPlugin
