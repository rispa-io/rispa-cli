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
    installProjectDepsYarn(projectPath)
    lernaBootstrapProjectYarn(projectPath)
  } else {
    installProjectDepsNpm(projectPath)
    lernaBootstrapProjectNpm(projectPath)
  }
}

const bootstrapProjectDeps = {
  title: 'Bootstrap project dependencies',
  task: bootstrapProjectDepsTask,
}

module.exports = bootstrapProjectDeps
