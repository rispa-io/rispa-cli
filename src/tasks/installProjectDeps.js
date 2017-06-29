const { checkUseYarnLerna } = require('../utils/useYarn')
const { installProjectDepsYarn, installProjectDepsNpm } = require('../utils/installProjectDeps')

const installProjectDepsTask = ctx => {
  const { projectPath } = ctx
  if (!('yarn' in ctx)) {
    ctx.yarn = checkUseYarnLerna(projectPath)
  }

  if (ctx.yarn) {
    installProjectDepsYarn(projectPath)
  } else {
    installProjectDepsNpm(projectPath)
  }
}

const installProjectDeps = {
  title: 'Install project dependencies',
  task: installProjectDepsTask,
}

module.exports = installProjectDeps
