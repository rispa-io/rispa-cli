const path = require('path')
const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const createUpdatePluginTagVersion = require('../tasks/updatePluginTagVersion')
const createUpdateTagVersion = require('../tasks/updateTagVersion')
const { checkDevMode } = require('../utils/tasks')
const { tagInfo: gitTagInfo } = require('../utils/git')
const { DEV_MODE } = require('../constants')

class NumerateCommand extends Command {
  constructor() {
    super({})

    this.state = {
      pluginsTags: [],
      projectTag: null,
    }

    this.getTags = this.getTags.bind(this)
    this.updatePluginsTagVersion = this.updatePluginsTagVersion.bind(this)
    this.updateProjectTagVersion = this.updateProjectTagVersion.bind(this)
  }

  getTags(ctx) {
    const mode = ctx.mode || ctx.configuration.mode
    const { projectPath, configuration } = ctx

    if (mode === DEV_MODE) {
      const pluginsPath = path.resolve(projectPath, configuration.pluginsPath)

      this.state.pluginsTags = configuration.plugins
        .map(pluginName => ({
          name: pluginName,
          path: path.resolve(pluginsPath, `./${pluginName}`),
        }))
        .map(plugin => Object.assign(plugin, {
          tag: gitTagInfo(plugin.path),
        }))
        .filter(plugin => !!plugin.tag)
    }

    this.state.projectTag = gitTagInfo(projectPath)
  }

  updatePluginsTagVersion() {
    const { pluginsTags } = this.state

    return new Listr(pluginsTags.map(createUpdatePluginTagVersion), { exitOnError: false })
  }

  updateProjectTagVersion({ projectPath }) {
    const { projectTag } = this.state

    return createUpdateTagVersion(projectPath, projectTag).task()
  }

  init() {
    this.add([
      readProjectConfiguration,
      {
        title: 'Get tags',
        task: this.getTags,
      },
      {
        title: 'Update plugins tag version',
        enabled: checkDevMode,
        skip: () => this.state.pluginsTags.length === 0,
        task: this.updatePluginsTagVersion,
      },
      {
        title: 'Update project tag version',
        skip: () => !this.state.projectTag,
        task: this.updateProjectTagVersion,
      },
    ])
  }
}

NumerateCommand.commandName = 'numerate'
NumerateCommand.commandDescription = 'Numerate'

module.exports = NumerateCommand
