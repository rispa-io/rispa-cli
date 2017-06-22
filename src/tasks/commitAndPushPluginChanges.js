const chalk = require('chalk')
const createCommitAndPushChanges = require('./commitAndPushChanges')
const { extendsTask } = require('../utils/tasks')

const createCommitAndPushPluginChanges = plugin => extendsTask(
  createCommitAndPushChanges(plugin.path, plugin.name),
  {
    title: `Commit plugin ${chalk.cyan(plugin.name)} changes`,
  }
)

module.exports = createCommitAndPushPluginChanges
