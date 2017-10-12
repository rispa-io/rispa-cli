const Listr = require('listr')
const path = require('path')
const fs = require('fs-extra')
const { prompt } = require('inquirer')
const configureGenerators = require('@rispa/generator')
const Command = require('../Command')
const { performProjectName, createDefaultConfiguration } = require('../utils/project')
const { init: gitInit, commit: gitCommit } = require('../utils/git')
const selectPlugins = require('../tasks/selectPlugins')
const fetchPlugins = require('../tasks/fetchPlugins')
const createInstallPlugin = require('../tasks/installPlugin')
const installProjectDeps = require('../tasks/installProjectDeps')
const saveProjectConfiguration = require('../tasks/saveProjectConfiguration')
const resolvePluginsDeps = require('../tasks/resolvePluginsDeps')
const { extendsTask, skipMode } = require('../utils/tasks')
const { DEV_MODE, TEST_MODE } = require('../constants')
const { findPluginForInstall } = require('../utils/plugin')

const skipTestMode = skipMode(TEST_MODE)

class CreateProjectCommand extends Command {
  constructor([projectName, remoteUrl, ...pluginsToInstall], options) {
    super(options)

    this.state = {
      projectName: projectName && performProjectName(projectName),
      remoteUrl,
      pluginsToInstall,
    }

    this.enterProjectName = this.enterProjectName.bind(this)
    this.enterRemoteUrl = this.enterRemoteUrl.bind(this)
    this.generateProjectStructure = this.generateProjectStructure.bind(this)
    this.gitInit = this.gitInit.bind(this)
    this.installPlugins = this.installPlugins.bind(this)
  }

  enterProjectName() {
    return prompt([{
      type: 'input',
      name: 'projectName',
      message: 'Enter project name:',
    }]).then(({ projectName }) => {
      this.state.projectName = performProjectName(projectName)
    })
  }

  enterRemoteUrl() {
    return prompt([{
      type: 'input',
      name: 'remoteUrl',
      message: 'Enter remote url for project (optional):',
    }]).then(({ remoteUrl }) => {
      this.state.remoteUrl = remoteUrl
    })
  }

  generateProjectStructure(ctx) {
    const { projectName } = this.state
    const { mode } = ctx

    ctx.projectPath = path.resolve(ctx.cwd, `./${projectName}`)

    if (fs.existsSync(ctx.projectPath)) {
      throw new Error(`The directory '${projectName}' already exist.\nTry using a new project name.`)
    }

    ctx.configuration = createDefaultConfiguration(mode)

    return configureGenerators(ctx.projectPath)
      .getGenerator('project')
      .runActions({ projectName })
  }

  gitInit({ projectPath }) {
    const { projectName, remoteUrl } = this.state
    gitInit(projectPath, remoteUrl)
    gitCommit(projectPath, `Create project '${projectName}'`)
  }

  installPlugins(ctx) {
    const { plugins } = ctx
    const { pluginsToInstall } = this.state

    ctx.pluginsPath = path.resolve(ctx.projectPath, ctx.configuration.pluginsPath)

    fs.ensureDirSync(ctx.pluginsPath)

    const installPlugins = pluginsToInstall.map(pluginName => {
      const plugin = findPluginForInstall(pluginName, plugins)

      return createInstallPlugin(plugin)
    })

    return new Listr(installPlugins, { exitOnError: false })
  }

  init() {
    const { projectName, remoteUrl, pluginsToInstall } = this.state
    return [
      {
        title: 'Enter project name',
        enabled: () => !projectName,
        task: this.enterProjectName,
      },
      {
        title: 'Enter remote url',
        skip: skipMode(DEV_MODE, TEST_MODE),
        enabled: () => !remoteUrl,
        task: this.enterRemoteUrl,
      },
      {
        title: 'Generate project structure',
        task: this.generateProjectStructure,
      },
      {
        title: 'Git init',
        skip: skipTestMode,
        task: this.gitInit,
      },
      extendsTask(fetchPlugins, {
        skip: skipTestMode,
      }),
      {
        title: 'Select plugins to install',
        skip: skipTestMode,
        enabled: () => pluginsToInstall.length === 0,
        task: selectPlugins.task,
        after: ctx => {
          this.state.pluginsToInstall = ctx.selectedPlugins
          delete ctx.selectedPlugins
        },
      },
      {
        title: 'Install plugins',
        task: this.installPlugins,
        skip: skipTestMode,
        before: ctx => {
          ctx.installedPlugins = []
        },
      },
      extendsTask(resolvePluginsDeps, {
        skip: skipTestMode,
      }),
      {
        title: 'Create configuration',
        task: saveProjectConfiguration.task,
      },
      installProjectDeps,
      {
        title: 'Git commit',
        skip: skipTestMode,
        task: ({ projectPath }) => gitCommit(projectPath, 'Bootstrap deps and install plugins'),
      },
    ]
  }
}

CreateProjectCommand.commandName = 'new'
CreateProjectCommand.commandDescription = 'Generate project structure'

module.exports = CreateProjectCommand
