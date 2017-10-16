const Listr = require('listr')
const { prompt } = require('inquirer')
const Command = require('../Command')
const scanPlugins = require('../tasks/scanPlugins')
const createRunPackageScriptTask = require('../tasks/runPluginScript')
const { extendsTask } = require('../utils/tasks')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const { ALL_PLUGINS } = require('../constants')
const { initDotenv } = require('../utils/env')
const { findPluginByName, getPluginName, equalPluginName } = require('../utils/plugin')

class RunPluginScriptCommand extends Command {
  constructor([pluginName, scriptName, ...args], options) {
    super(options)

    this.state = {
      pluginName,
      scriptName,
      args,
    }

    this.runScripts = this.runScripts.bind(this)
    this.selectPlugin = this.selectPlugin.bind(this)
    this.selectScript = this.selectScript.bind(this)
  }

  selectPlugin(ctx) {
    const plugins = ctx.plugins
      .filter(plugin => plugin.scripts && plugin.scripts.length)
      .map(plugin => ({
        name: getPluginName(plugin),
        value: plugin,
      }))

    if (plugins.length === 0) {
      throw new Error('Can\'t find plugins with scripts')
    }

    return prompt([{
      type: 'list',
      name: 'plugin',
      message: 'Select available plugin:',
      paginated: true,
      choices: plugins,
    }]).then(({ plugin }) => {
      this.state.plugin = plugin
    })
  }

  selectScript() {
    const { plugin } = this.state

    return prompt([{
      type: 'list',
      name: 'scriptName',
      message: 'Select available script:',
      paginated: true,
      choices: plugin.scripts,
    }]).then(({ scriptName }) => {
      this.state.scriptName = scriptName
    })
  }

  getAllPlugins(ctx) {
    const { scriptName } = this.state
    const { skip: skipPlugins = [] } = ctx

    const pluginsToRun = ctx.plugins
      .filter(plugin =>
        !plugin.npm &&
        plugin.scripts.indexOf(scriptName) !== -1 &&
        !skipPlugins.some(skipPluginName => equalPluginName(skipPluginName, plugin))
      )

    return pluginsToRun
  }

  getSinglePlugin() {
    const { plugin, scriptName } = this.state

    if (plugin.scripts.indexOf(scriptName) === -1) {
      throw new Error(`Can't find script '${scriptName}' in plugin with name '${plugin.name}'`)
    }

    return plugin
  }

  runScripts(ctx) {
    const { scriptName, args } = this.state

    initDotenv()

    const pluginsToRun = this.state.pluginName === ALL_PLUGINS
      ? this.getAllPlugins(ctx)
      : [this.getSinglePlugin(ctx)]

    return new Listr(pluginsToRun.map(({ name, path }) =>
      createRunPackageScriptTask(name, path, scriptName, args)
    ), { exitOnError: false })
  }

  init() {
    const { pluginName, scriptName } = this.state

    return [
      readProjectConfiguration,
      extendsTask(scanPlugins, {
        after: ctx => {
          if (ctx.plugins.length === 0) {
            throw new Error('Can\'t find plugins')
          }

          if (pluginName && pluginName !== ALL_PLUGINS) {
            const plugin = findPluginByName(ctx.plugins, pluginName)

            if (!plugin) {
              throw new Error('Can\'t find plugin')
            }

            this.state.plugin = plugin
          }
        },
      }),
      {
        title: 'Select plugin',
        enabled: () => !pluginName,
        task: this.selectPlugin,
      },
      {
        title: 'Select script',
        enabled: () => pluginName !== ALL_PLUGINS && !scriptName,
        task: this.selectScript,
      },
      {
        title: 'Run scripts',
        task: this.runScripts,
      },
    ]
  }
}

RunPluginScriptCommand.commandName = 'run'
RunPluginScriptCommand.commandDescription = 'Run plugin script'

module.exports = RunPluginScriptCommand
