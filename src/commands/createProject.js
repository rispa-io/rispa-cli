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
const { skipDevMode } = require('../utils/tasks')

class CreateProjectCommand extends Command {
  constructor([projectName, remoteUrl], options) {
    super(options)

    this.state = {
      projectName: projectName && performProjectName(projectName),
      remoteUrl,
      pluginsForInstall: [],
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
    const { pluginsToInstall } = this.state
    const { projectPath } = ctx

    ctx.pluginsPath = path.resolve(projectPath, ctx.configuration.pluginsPath)

    fs.ensureDirSync(ctx.pluginsPath)

    return new Listr(
      pluginsToInstall.map(({ name, cloneUrl }) =>
        createInstallPlugin(name, cloneUrl)
      ), { exitOnError: false }
    )
  }

  init() {
    const { projectName, remoteUrl } = this.state
    this.add([
      {
        title: 'Enter project name',
        enabled: () => !projectName,
        task: this.enterProjectName,
      },
      {
        title: 'Enter remote url',
        skip: skipDevMode,
        enabled: () => !remoteUrl,
        task: this.enterRemoteUrl,
      },
      {
        title: 'Generate project structure',
        task: this.generateProjectStructure,
      },
      {
        title: 'Git init',
        task: this.gitInit,
      },
      fetchPlugins,
      {
        title: 'Select plugins to install',
        task: selectPlugins.task,
        after: ctx => {
          this.state.pluginsToInstall = ctx.selectedPlugins
          delete ctx.selectedPlugins
        },
      },
      {
        title: 'Install plugins',
        task: this.installPlugins,
        before: ctx => {
          ctx.installedPlugins = []
        },
      },
      resolvePluginsDeps,
      installProjectDeps,
      {
        title: 'Create configuration',
        task: saveProjectConfiguration.task,
      },
      {
        title: 'Git commit',
        task: ({ projectPath }) => gitCommit(projectPath, 'Bootstrap deps and install plugins'),
      },
    ])
  }
}

CreateProjectCommand.commandName = 'new'
CreateProjectCommand.commandDescription = 'Generate project structure'

module.exports = CreateProjectCommand
