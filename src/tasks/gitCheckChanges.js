const { getChanges: gitGetChanges } = require('../utils/git')

const gitCheckChangesTask = ctx => {
  ctx.hasChanges = gitGetChanges(ctx.projectPath)
}

const gitCheckChanges = {
  title: 'Git check the changes',
  task: gitCheckChangesTask,
}

module.exports = gitCheckChanges
