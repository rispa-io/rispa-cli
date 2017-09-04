const Listr = require('listr')
const { prompt } = require('inquirer')
const Command = require('../Command')
const scanPlugins = require('../tasks/scanPlugins')
const createRunPackageScriptTask = require('../tasks/runPluginScript')
const { extendsTask } = require('../utils/tasks')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const { ALL_PLUGINS } = require('../constants')
const { initDotenv } = require('../utils/env')

class RunPluginScriptCommand extends Command {
  constructor([pluginName, scriptName, ...args], options) {
    super(options)

    this.state = {
      pluginName,
      scriptName,
      args,
    }

    this.runScripts = this.runScripts.bind(this)
    this.checking = this.checking.bind(this)
    this.selectPlugin = this.selectPlugin.bind(this)
    this.selectScript = this.selectScript.bind(this)
  }

  checking(ctx) {
    initDotenv()

    if (this.state.pluginName === ALL_PLUGINS) {
      this.checkingAll(ctx)
    } else {
      this.checkingSingle(ctx)
    }
  }

  checkingAll(ctx) {
    const { scriptName } = this.state
    const { skip: skipPlugins = [] } = ctx

    ctx.plugins = Object.values(ctx.plugins)
      .filter(((plugin, idx, plugins) =>
          plugins.indexOf(plugin) === idx &&
          !plugin.npm &&
          plugin.scripts.indexOf(scriptName) !== -1 &&
          skipPlugins.indexOf(plugin.name) === -1 &&
          skipPlugins.indexOf(plugin.alias) === -1
      ))
  }

  checkingSingle(ctx) {
    const { pluginName, scriptName } = this.state
    const currentPlugin = ctx.plugins[pluginName]
    if (currentPlugin.scripts.indexOf(scriptName) === -1) {
      throw new Error(`Can't find script '${scriptName}' in plugin with name '${pluginName}'`)
    }

    ctx.plugins = [currentPlugin]
  }

  selectPlugin(ctx) {
    const plugins = Object.values(ctx.plugins)
      .filter(plugin => plugin.scripts && plugin.scripts.length)
      .map(plugin => plugin.name)

    if (plugins.length === 0) {
      throw new Error('Can\'t find plugins with scripts')
    }

    return prompt([{
      type: 'list',
      name: 'pluginName',
      message: 'Select available plugin:',
      paginated: true,
      choices: plugins,
    }]).then(({ pluginName }) => {
      this.state.pluginName = pluginName
    })
  }

  selectScript(ctx) {
    const { pluginName } = this.state
    const scripts = ctx.plugins[pluginName].scripts

    return prompt([{
      type: 'list',
      name: 'scriptName',
      message: 'Select available script:',
      paginated: true,
      choices: scripts,
    }]).then(({ scriptName }) => {
      this.state.scriptName = scriptName
    })
  }

  runScripts({ plugins }) {
    const { scriptName, args } = this.state

    return new Listr(plugins.map(plugin =>
      createRunPackageScriptTask(plugin.name, plugin.path, scriptName, args)
    ), { exitOnError: false })
  }

  init() {
    const { pluginName, scriptName } = this.state
    this.add([
      readProjectConfiguration,
      extendsTask(scanPlugins, {
        after: ctx => {
          ctx.plugins = Object.values(ctx.plugins).reduce((result, plugin) => {
            if (plugin.alias) {
              result[plugin.alias] = plugin
            }

            result[plugin.name] = plugin

            return result
          }, {})

          if (Object.keys(ctx.plugins).length === 0) {
            throw new Error('Can\'t find plugins')
          }

          if (pluginName && pluginName !== ALL_PLUGINS && !ctx.plugins[pluginName]) {
            throw new Error('Can\'t find plugin')
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
        title: 'Checking',
        task: this.checking,
      },
      {
        title: 'Run scripts',
        task: this.runScripts,
      },
    ])
  }
}

RunPluginScriptCommand.commandName = 'run'
RunPluginScriptCommand.commandDescription = 'Run plugin script'

module.exports = RunPluginScriptCommand
