const { readConfiguration } = require('../utils/project')

const readProjectConfigurationTask = ctx => {
  if (!ctx.projectPath) {
    ctx.projectPath = ctx.cwd
  }

  const configuration = readConfiguration(ctx.projectPath)
  if (!configuration) {
    throw new Error('Can\'t find rispa project config')
  }

  ctx.configuration = configuration
}

const readProjectConfiguration = {
  title: 'Read project configuration',
  task: readProjectConfigurationTask,
}

module.exports = readProjectConfiguration
