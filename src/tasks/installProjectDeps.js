const spawn = require('cross-spawn')
const { checkUseYarnLerna } = require('../utils/useYarn')

const installProjectDepsYarn = projectPath => (
  spawn.sync(
    'yarn',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const installProjectDepsNpm = projectPath => (
  spawn.sync(
    'npm',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

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
