const fs = require('fs-extra')
const path = require('path')
const spawn = require('cross-spawn')
const { prompt } = require('inquirer')
const configureGenerators = require('@rispa/generator')

const { handleError, requireIfExist } = require('../core')
const githubApi = require('../githubApi')
const { installPlugins } = require('../plugin')
const { saveConfiguration } = require('../project')

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

const selectInstallPlugins = plugins => prompt([{
  type: 'checkbox',
  message: 'Select install plugins:',
  name: 'installPluginsNames',
  choices: plugins,
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

const lernaBootstrapProjectNpm = projectPath => (
  spawn.sync(
    'npm',
    ['run', 'bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const lernaBootstrapProjectYarn = projectPath => (
  spawn.sync(
    'yarn',
    ['bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const gitInitAndCommit = (projectPath, remoteUrl) => {
  const options = { cwd: projectPath, stdio: 'inherit' }
  spawn.sync('git', ['init'], options)
  if (remoteUrl) {
    spawn.sync('git', ['remote', 'add', 'origin', remoteUrl], options)
  }
  spawn.sync('git', ['add', '.'], options)
  spawn.sync('git', ['commit', '-m', 'Initial commit'], options)
}

const generateProjectStructure = async projectPath => {
  const generators = configureGenerators(projectPath)
  await generators.getGenerator('project').runActions()
}

const generatePlugins = async (pluginsPath, mode) => {
  const { data: { items: plugins } } = await githubApi.plugins()
  const { installPluginsNames } = await selectInstallPlugins(plugins)

  fs.ensureDirSync(pluginsPath)

  if (mode === 'dev') {
    installPlugins(installPluginsNames, plugins, [], pluginsPath)
  } else {
    installPlugins(installPluginsNames, plugins, [], pluginsPath)
  }

  return installPluginsNames
}

const bootstrapProjectDeps = projectPath => {
  const { npmClient } = requireIfExist(path.resolve(projectPath, './lerna.json'))
  if (npmClient === 'npm') {
    installProjectDepsNpm(projectPath)
    lernaBootstrapProjectNpm(projectPath)
  } else {
    installProjectDepsYarn(projectPath)
    lernaBootstrapProjectYarn(projectPath)
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

    const plugins = await generatePlugins(pluginsPath, mode)

    bootstrapProjectDeps(projectPath)

    saveConfiguration({
      plugins,
      pluginsPath,
      mode,
    }, projectPath)

    gitInitAndCommit(projectPath, remoteUrl)

    console.log(`Project "${projectName}" successfully generated!`)
  } catch (e) {
    handleError(e)
  }

  process.exit(1)
}

module.exports = create

