const path = require('path')
const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const { getChanges: gitGetChanges } = require('../utils/git')
const createCommitAndPushPluginChanges = require('../tasks/commitAndPushPluginChanges')
const createCommitAndPushChanges = require('../tasks/commitAndPushChanges')
const { checkDevMode } = require('../utils/tasks')

class CommitCommand extends Command {
  constructor() {
    super({})

    this.state = {
      pluginsChanges: [],
      projectChanges: null,
    }

    this.getChanges = this.getChanges.bind(this)
    this.commitPluginsChanges = this.commitPluginsChanges.bind(this)
    this.commitProjectChanges = this.commitProjectChanges.bind(this)
  }

  getChanges(ctx) {
    const mode = ctx.mode || ctx.configuration.mode
    const { projectPath, configuration } = ctx

    if (mode === 'dev') {
      const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)

      this.state.pluginsChanges = configuration.plugins
        .map(pluginName => ({
          name: pluginName,
          path: path.resolve(pluginsPath, `./${pluginName}`),
        }))
        .map(plugin => Object.assign(plugin, {
          changes: gitGetChanges(plugin.path),
        }))
        .filter(plugin => !!plugin.changes)
    }

    this.state.projectChanges = gitGetChanges(projectPath)
  }

  commitPluginsChanges() {
    const { pluginsChanges } = this.state

    return new Listr(pluginsChanges.map(createCommitAndPushPluginChanges))
  }

  commitProjectChanges({ projectPath }) {
    const { projectChanges } = this.state

    return createCommitAndPushChanges(projectPath, projectChanges).task()
  }

  init() {
    this.add([
      readProjectConfiguration,
      {
        title: 'Get changes',
        task: this.getChanges,
      },
      {
        title: 'Commit plugins changes',
        enabled: checkDevMode,
        task: this.commitPluginsChanges,
      },
      {
        title: 'Commit project changes',
        skip: () => !this.state.projectChanges,
        task: this.commitProjectChanges,
      },
    ])
  }
}

CommitCommand.commandName = 'commit'
CommitCommand.commandDescription = 'Commit changes'

module.exports = CommitCommand
