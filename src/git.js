const spawn = require('cross-spawn')

module.exports.cloneRepository = (cloneUrl, path) => {
  return spawn.sync(
    'git',
    ['clone', cloneUrl],
    {
      cwd: path
    }
  ).status
}