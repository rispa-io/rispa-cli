const spawn = require('cross-spawn')

const postinstallTask = ({ plugins, projectPath }) => {
  Object.keys(plugins).forEach(pluginName => {
    const { postinstall } = plugins[pluginName]
    if (postinstall) {
      const commands = postinstall.split('&&')
      commands.forEach(command => {
        const args = command.trim().split(/\s+/)
        spawn.sync(
          args[0],
          args.slice(1),
          {
            cwd: projectPath,
            stdio: 'inherit',
          }
        )
      })
    }
  })
}

const postinstall = {
  title: 'Run postinstall scripts',
  task: postinstallTask,
}

module.exports = postinstall
