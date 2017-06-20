const path = require('path')
const spawn = require('cross-spawn')
const { prompt } = require('inquirer')
const configureGenerators = require('@rispa/generator')

const { handleError, requireIfExist } = require('../core')
const { installPlugins, selectPluginsToInstall } = require('../plugin')
const { saveConfiguration } = require('../project')
const { init: gitInit, commit: gitCommit } = require('../git')

const enterProjectName = () => prompt([{
  type: 'input',
  name: 'projectName',
  message: 'Enter project name:',
}])

const enterRemoteUrl = () => prompt([{
  type: 'input',
  name: 'remoteUrl',
  message: 'Enter remote url for project (optional):',
}])

const installProjectDepsYarn = projectPath => (
  spawn.sync(
    'yarn',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const installProjectDepsNpm = projectPath => (
  spawn.sync(
    'npm',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const generateProjectStructure = async projectPath => {
  const generators = configureGenerators(projectPath)
  await generators.getGenerator('project').runActions()
}

const bootstrapProjectDeps = projectPath => {
  const { npmClient } = requireIfExist(path.resolve(projectPath, './lerna.json'))
  if (npmClient === 'npm') {
    installProjectDepsNpm(projectPath)
  } else {
    installProjectDepsYarn(projectPath)
  }
}

const performProjectName = projectName => (
  projectName.replace(/\s+/g, '-')
)

const parseParams = args =>
  args.reduce((params, arg) => {
    const paramMatch = /^--([^=]+)=(.*)/.exec(arg)
    if (paramMatch) {
      params[paramMatch[1]] = paramMatch[2]
    } else {
      params.name = arg
    }
    return params
  }, {})

const create = async (...args) => {
  try {
    const distPath = process.cwd()
    const { name, mode } = parseParams(args)

    const projectName = performProjectName(
      name || (await enterProjectName()).projectName
    )
    const remoteUrl = (await enterRemoteUrl()).remoteUrl

    const projectPath = path.resolve(distPath, `./${projectName}`)
    const pluginsPath = path.resolve(projectPath, './packages')

    await generateProjectStructure(projectPath)

    gitInit(projectPath, remoteUrl)
    gitCommit(projectPath, `Create project '${projectName}'`)

    const plugins = await selectPluginsToInstall()

    installPlugins(plugins, projectPath, pluginsPath, mode)

    bootstrapProjectDeps(projectPath)

    saveConfiguration({
      mode,
      pluginsPath: './packages',
      plugins: plugins.map(plugin => plugin.name),
      remotes: plugins.reduce((remotes, plugin) => {
        remotes[plugin.name] = plugin.clone_url
        return remotes
      }, {}),
    }, projectPath)

    gitCommit(projectPath, 'Bootstrap deps and install plugins')

    console.log(`Project "${projectName}" successfully generated!`)
  } catch (e) {
    handleError(e)
  }

  process.exit(1)
}

module.exports = create

