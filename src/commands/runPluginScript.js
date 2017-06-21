const Listr = require('listr')
const { prompt } = require('inquirer')
const Command = require('../Command')
const scanPluginsTask = require('../tasks/scanPlugins')
const createRunPackageScriptTask = require('../tasks/runPluginScript')

class RunPluginScriptCommand extends Command {
  constructor([pluginName, scriptName, ...args]) {
    super({})

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
    if (this.state.pluginName === 'all') {
      this.checkingAll(ctx)
    } else {
      this.checkingSingle(ctx)
    }
  }

  checkingAll(ctx) {
    const { scriptName } = this.state

    ctx.plugins = Object.values(ctx.plugins)
      .filter((value, idx, values) => values.indexOf(value) === idx)
      .filter(({ scripts }) => scripts.indexOf(scriptName) !== -1)

    if (ctx.plugins.length === 0) {
      throw new Error(`Can't find script '${scriptName}' in plugins`)
    }
  }

  checkingSingle(ctx) {
    const { pluginName, scriptName } = this.state
    const currentPlugin = ctx.plugins[pluginName]
    if (!currentPlugin) {
      throw new Error(`Can't find plugin with name '${pluginName}'`)
    } else if (currentPlugin.scripts.indexOf(scriptName) === -1) {
      throw new Error(`Can't find script '${scriptName}' in plugin with name '${pluginName}'`)
    }

    ctx.plugins = [currentPlugin]
  }

  selectPlugin(ctx) {
    return prompt([{
      type: 'list',
      name: 'pluginName',
      message: 'Select available plugin:',
      paginated: true,
      choices: [...new Set(Object.keys(ctx.plugins).map(key => ctx.plugins[key].name))],
    }]).then(({ pluginName }) => {
      this.state.pluginName = pluginName
    })
  }

  selectScript(ctx) {
    const { pluginName } = this.state
    return prompt([{
      type: 'list',
      name: 'scriptName',
      message: 'Select available script:',
      paginated: true,
      choices: ctx.plugins[pluginName].scripts,
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
    this.add(Object.assign({}, scanPluginsTask, {
      before: ctx => {
        ctx.projectPath = ctx.cwd
      },
      after: ({ plugins }) => {
        if (Object.keys(plugins).length === 0) {
          throw new Error('Can\'t find plugins')
        }
      },
    }))
    this.add([{
      title: 'Select plugin',
      enabled: () => !pluginName,
      task: this.selectPlugin,
    }, {
      title: 'Select script',
      enabled: () => pluginName !== 'all' && !scriptName,
      task: this.selectScript,
    }, {
      title: 'Checking',
      task: this.checking,
    }, {
      title: 'Run scripts',
      task: this.runScripts,
    }])
  }
}

RunPluginScriptCommand.commandName = 'run'
RunPluginScriptCommand.commandDescription = 'Run plugin script'

module.exports = RunPluginScriptCommand