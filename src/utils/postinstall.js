const spawn = require('cross-spawn')

const postinstall = projectPath => {
  spawn.sync(
    'ris',
    ['postinstall'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  )
}

module.exports = {
  postinstall,
}
