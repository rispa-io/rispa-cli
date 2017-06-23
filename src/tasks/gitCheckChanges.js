const { getChanges: gitGetChanges } = require('../utils/git')

const gitCheckChangesTask = ctx => {
  if (!ctx.projectPath) {
    ctx.projectPath = ctx.cwd
  }

  ctx.hasChanges = gitGetChanges(ctx.projectPath)
}

const gitCheckChanges = {
  title: 'Git check the changes',
  task: gitCheckChangesTask,
}

module.exports = gitCheckChanges
