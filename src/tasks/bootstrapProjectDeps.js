const spawn = require('cross-spawn')
const { checkUseYarnLerna } = require('../utils/useYarn')

const lernaBootstrapProjectNpm = projectPath => (
  spawn.sync(
    'npm',
    ['run', 'bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const lernaBootstrapProjectYarn = projectPath => (
  spawn.sync(
    'yarn',
    ['bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const bootstrapProjectDepsTask = ctx => {
  const { projectPath } = ctx
  if (!('yarn' in ctx)) {
    ctx.yarn = checkUseYarnLerna(projectPath)
  }

  if (ctx.yarn) {
    lernaBootstrapProjectYarn(projectPath)
  } else {
    lernaBootstrapProjectNpm(projectPath)
  }
}

const bootstrapProjectDeps = {
  title: 'Bootstrap project dependencies',
  task: bootstrapProjectDepsTask,
}

module.exports = bootstrapProjectDeps
