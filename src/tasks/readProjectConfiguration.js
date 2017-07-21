const R = require('ramda')
const { readConfiguration } = require('../utils/project')
const { readPresetConfiguration } = require('../utils/preset')

const prepareConfiguration = (projectPath, configuration) => {
  if (!configuration.extends) {
    return configuration
  }

  const extendsConfiguration = readPresetConfiguration(configuration.extends, projectPath)

  return R.mergeDeepRight(configuration, {
    plugins: configuration.plugins.concat(extendsConfiguration.plugins),
    remotes: extendsConfiguration.remotes,
  })
}

const readProjectConfigurationTask = ctx => {
  if (!ctx.projectPath) {
    ctx.projectPath = ctx.cwd
  }

  const configuration = readConfiguration(ctx.projectPath)
  if (!configuration) {
    throw new Error('Can\'t find rispa project config')
  }

  ctx.configuration = prepareConfiguration(ctx.projectPath, configuration)
}

const readProjectConfiguration = {
  title: 'Read project configuration',
  task: readProjectConfigurationTask,
}

module.exports = readProjectConfiguration
