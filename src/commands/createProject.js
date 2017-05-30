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

const installProjectDeps = (projectPath, npmClient) => (
  npmClient === 'npm' ?
    installProjectDepsNpm(projectPath) :
    installProjectDepsYarn(projectPath)
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

const lernaBootstrapProject = (projectPath, npmClient) => (
  npmClient === 'npm' ?
    lernaBootstrapProjectNpm(projectPath) :
    lernaBootstrapProjectYarn(projectPath)
)

const generateProject = async (projectName, distPath, installPluginsNames, plugins) => {
  const projectPath = path.resolve(distPath, `./${projectName}`)
  const resolve = relPath => path.resolve(projectPath, relPath)

  const pluginsPath = resolve('./packages')
  const generators = configureGenerators(projectPath)

  await generators.getGenerator('project').runActions()

  fs.ensureDirSync(pluginsPath)

  installPlugins(installPluginsNames, plugins, [], pluginsPath)

  saveConfiguration({
    plugins: installPluginsNames,
    pluginsPath: './packages',
  }, projectPath)

  const { npmClient } = requireIfExist(resolve('./lerna.json'))

  installProjectDeps(projectPath, npmClient)

  lernaBootstrapProject(projectPath, npmClient)

  console.log(`Project "${projectName}" successfully generated!`)
}

const performProjectName = projectName => (
  projectName.replace(/\s+/g, '-')
)

const create = async (...args) => {
  try {
    let projectName = args[0]
    if (!projectName) {
      projectName = (await enterProjectName()).projectName
    }

    projectName = performProjectName(projectName)

    const distPath = process.cwd()

    const { data: { items: plugins } } = await githubApi.plugins()

    const { installPluginsNames } = await selectInstallPlugins(plugins)

    await generateProject(projectName, distPath, installPluginsNames, plugins)
  } catch (e) {
    handleError(e)
  }

  process.exit(1)
}

module.exports = create
