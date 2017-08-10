const R = require('ramda')
const { saveConfiguration } = require('../utils/project')
const { readPresetConfiguration } = require('../utils/preset')

const getExtendsPlugins = R.compose(
  R.prop('plugins'),
  readPresetConfiguration
)

const prepareConfiguration = (projectPath, configuration) => {
  if (!configuration.extends) {
    return configuration
  }

  const extendsPlugins = getExtendsPlugins(configuration.extends, projectPath)

  return R.merge(configuration, {
    plugins: R.filter(
      R.compose(
        R.not,
        R.contains(R.__, extendsPlugins)
      ),
      configuration.plugins
    ),
    remotes: R.compose(
      R.fromPairs,
      R.filter(R.compose(
        R.not,
        R.contains(R.__, extendsPlugins),
        R.head
      )),
      R.toPairs
    )(configuration.remotes),
  })
}

const saveProjectConfigurationTask = ctx => {
  const { projectPath } = ctx

  const configuration = prepareConfiguration(projectPath, ctx.configuration)

  saveConfiguration(configuration, projectPath)
}

const saveProjectConfiguration = {
  title: 'Save project configuration',
  task: saveProjectConfigurationTask,
}

module.exports = saveProjectConfiguration
