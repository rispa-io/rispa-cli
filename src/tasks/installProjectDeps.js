const spawn = require('cross-spawn')
const { checkUseYarnLerna } = require('../utils/useYarn')

const installProjectDepsYarn = projectPath => {
  const result = spawn.sync(
    'yarn',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  )

  if (result.status !== 0) {
    throw new Error('Failed install project deps via yarn')
  }
}

const installProjectDepsNpm = projectPath => {
  const result = spawn.sync(
    'npm',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  )

  if (result.status !== 0) {
    throw new Error('Failed install project deps via npm')
  }
}

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
