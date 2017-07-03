const path = require('path')
const chalk = require('chalk')
const { prompt } = require('inquirer')
const Listr = require('listr')
const Command = require('../Command')
const readProjectConfiguration = require('../tasks/readProjectConfiguration')
const scanPluginsVersion = require('../tasks/scanPluginsVersion')
const createCheckoutPlugin = require('../tasks/checkoutPlugin')
const updatePluginsVersion = require('../tasks/updatePluginsVersion')
const { checkDevMode } = require('../utils/tasks')
const { DEFAULT_PLUGIN_DEV_BRANCH, PLUGIN_PREFIX } = require('../constants')

const selectNextVersion = versions => prompt([{
  type: 'list',
  name: 'nextVersion',
  choices: Object.entries(versions).map(([name, version]) => ({
    name: `${name} ${version}`,
    value: version,
  })),
  message: 'Select next version:',
}])

const askWantToContinue = () => prompt([{
  type: 'confirm',
  name: 'confirm',
  message: 'Want to continue ?',
  default: false,
}])

class ReleaseCommand extends Command {
  constructor([...args], options) {
    super(options)
  }

  init() {
    this.add([
      readProjectConfiguration,
      {
        title: 'Checkout plugins',
        before: ctx => {
          if (!checkDevMode(ctx)) {
            throw new Error('Release available only in development mode')
          }
        },
        task: ctx => {
          const pluginsPath = path.resolve(ctx.projectPath, ctx.configuration.pluginsPath)
          const plugins = ctx.configuration.plugins.map(pluginName => ({
            name: pluginName,
            path: path.resolve(pluginsPath, `./${pluginName}`),
          }))

          ctx.plugins = plugins

          return new Listr(plugins.map(plugin =>
            createCheckoutPlugin(plugin.name, plugin.path, DEFAULT_PLUGIN_DEV_BRANCH)
          ))
        },
      },
      scanPluginsVersion,
      {
        title: 'Check dependencies',
        task: ctx => {
          const pluginNames = ctx.plugins.map(({ packageInfo }) => packageInfo.name)
          const dependencies = Object.keys(
            ctx.plugins.reduce((result, { packageInfo }) => Object.assign(
              result,
              packageInfo.dependencies,
              packageInfo.devDependencies,
              packageInfo.peerDependencies
            ), {})
          ).filter(dependency => dependency.startsWith(PLUGIN_PREFIX))

          const notFoundDependencies = dependencies.filter(dependency => pluginNames.indexOf(dependency) === -1)
          if (notFoundDependencies.length) {
            console.log(chalk.bold.red('Can\'t find dependencies in project:\n'), chalk.cyan(notFoundDependencies.join(', ')))
            return askWantToContinue()
              .then(({ confirm }) =>
                !confirm && Promise.reject(new Error('Interrupt command'))
              )
          }

          return Promise.resolve()
        },
      },
      {
        title: 'Select next version',
        task: ctx => {
          const { major, minor, patch } = ctx.maxVersion
          const versions = {
            PATCH: `${major}.${minor}.${+patch + 1}`,
            MINOR: `${major}.${+minor + 1}.0`,
            MAJOR: `${+major + 1}.0.0`,
          }

          return selectNextVersion(versions)
            .then(({ nextVersion }) => {
              ctx.nextVersion = nextVersion
            })
        },
      },
      updatePluginsVersion,
    ])
  }
}

ReleaseCommand.commandName = 'release'
ReleaseCommand.commandDescription = 'Release plugins'

module.exports = ReleaseCommand
