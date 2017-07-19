const spawn = require('cross-spawn')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const scanPlugins = require('../tasks/scanPlugins')

class CommitCommand extends Command {
  init() {
    this.add([
      readProjectConfiguration,
      scanPlugins,
      {
        title: 'Run rispa-postinstall scripts of plugins',
        task: ({ plugins, cwd }) => {
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
                    cwd,
                    stdio: 'inherit',
                  }
                )
              })
            }
          })
        },
      },
    ])
  }
}

CommitCommand.commandName = 'postinstall'
CommitCommand.commandDescription = 'Postinstall script'

module.exports = CommitCommand
