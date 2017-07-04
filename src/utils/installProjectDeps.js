const spawn = require('cross-spawn')

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

module.exports = {
  installProjectDepsYarn,
  installProjectDepsNpm,
}
