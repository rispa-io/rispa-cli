const { saveConfiguration } = require('../utils/project')

const saveProjectConfigurationTask = ctx => {
  const { projectPath, configuration } = ctx

  saveConfiguration(configuration, projectPath)
}

const saveProjectConfiguration = {
  title: 'Save project configuration',
  task: saveProjectConfigurationTask,
}

module.exports = saveProjectConfiguration
