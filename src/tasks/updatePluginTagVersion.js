const chalk = require('chalk')
const createUpdateTagVersion = require('./updateTagVersion')
const { extendsTask } = require('../utils/tasks')

const createUpdatePluginTagVersion = ({ name, path, tag }) => extendsTask(
  createUpdateTagVersion(path, tag),
  {
    title: `Update plugin ${chalk.cyan(name)} tag version`,
  }
)

module.exports = createUpdatePluginTagVersion
