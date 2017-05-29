const fs = require('fs-extra')
const path = require('path')
const spawn = require('cross-spawn')
const { prompt } = require('inquirer')
const configureGenerators = require('@rispa/generator')

const { handleError, callScript } = require('../core')
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

const installProjectDeps = projectPath => (
  spawn.sync(
    'npm',
    ['install'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const lernaBootstrapProject = projectPath => (
  spawn.sync(
    'npm',
    ['run', 'bs'],
    {
      cwd: projectPath,
      stdio: 'inherit',
    }
  ).status
)

const generateProject = async (projectName, installPluginsNames, plugins) => {
  const projectPath = path.resolve(process.cwd(), `./${projectName}`)
  const pluginsPath = `${projectPath}/packages`
  const generators = configureGenerators(projectPath)

  await generators.getGenerator('project').runActions()

  fs.ensureDirSync(pluginsPath)

  installPlugins(installPluginsNames, plugins, [], pluginsPath)

  saveConfiguration({
    plugins: installPluginsNames,
    pluginsPath: './packages',
  }, projectPath)

  installProjectDeps(projectPath)

  lernaBootstrapProject(projectPath)

  console.log(`Project "${projectName}" successfully generated!`)
}

const performProjectName = projectName => (
  projectName.replace(/\s+/g, '-').toLowerCase()
)

const create = async (...args) => {
  try {
    let projectName = args[0]
    if (!projectName) {
      projectName = (await enterProjectName()).projectName
    }

    projectName = performProjectName(projectName)

    const { data: { items: plugins } } = await githubApi.plugins()

    const { installPluginsNames } = await selectInstallPlugins(plugins)

    await generateProject(projectName, installPluginsNames, plugins)
  } catch (e) {
    handleError(e)
  }

  process.exit(1)
}

module.exports = create
