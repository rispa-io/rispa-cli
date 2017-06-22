const chalk = require('chalk')
const { prompt } = require('inquirer')
const configureGenerators = require('@rispa/generator')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const scanPlugins = require('../tasks/scanPlugins')

class GenerateCommand extends Command {
  constructor([pluginName, generatorName, args]) {
    super({})

    this.state = {
      pluginName,
      generatorName,
      args,
    }

    this.initGenerators = this.initGenerators.bind(this)
    this.selectPlugin = this.selectPlugin.bind(this)
    this.selectGenerator = this.selectGenerator.bind(this)
    this.runGenerator = this.runGenerator.bind(this)
  }

  initGenerators(ctx) {
    const { pluginName } = this.state
    const plugin = ctx.plugins[pluginName]

    if (!plugin) {
      throw new Error(`Can't find plugin with name ${chalk.cyan(pluginName)}`)
    }

    const generatorsPaths = Object.values(ctx.plugins)
      .map(({ generator }) => generator)
      .filter((generator, idx, values) => generator && values.indexOf(generator) === idx)

    const generators = configureGenerators(plugin.path, generatorsPaths)

    if (generators.getGeneratorList().length === 0) {
      throw new Error('Can\'t find generators')
    }

    ctx.generators = generators
  }

  selectPlugin(ctx) {
    return prompt([{
      type: 'list',
      name: 'pluginName',
      message: 'Select plugin:',
      paginated: true,
      choices: [...new Set(Object.keys(ctx.plugins).map(key => ctx.plugins[key].name))],
    }]).then(({ pluginName }) => {
      this.state.pluginName = pluginName
    })
  }

  selectGenerator({ generators }) {
    return prompt([{
      type: 'list',
      name: 'generatorName',
      message: 'Select generator:',
      paginated: true,
      choices: generators.getGeneratorList(),
    }]).then(({ generatorName }) => {
      this.state.generatorName = generatorName
    })
  }

  runGenerator(ctx) {
    const { generatorName, args } = this.state
    const { generators } = ctx

    if (!generators.containsGenerator(generatorName)) {
      throw new Error(`Can't find generator with name ${chalk.cyan(generatorName)}`)
    }

    return generators.getGenerator(generatorName)
      .runActions(Object.assign({}, ctx, { args }))
  }

  init() {
    const { pluginName, generatorName } = this.state
    this.add([
      readProjectConfiguration,
      scanPlugins,
      {
        title: 'Select plugin',
        enabled: () => !pluginName,
        task: this.selectPlugin,
      },
      {
        title: 'Init generators',
        task: this.initGenerators,
      },
      {
        title: 'Select generator',
        enabled: () => !generatorName,
        task: this.selectGenerator,
      },
      {
        title: 'Run generator',
        task: this.runGenerator,
      },
    ])
  }
}

GenerateCommand.commandName = 'g'
GenerateCommand.commandDescription = 'Run generator'

module.exports = GenerateCommand
