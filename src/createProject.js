/* eslint-disable no-console */

const fs = require('fs-extra')
const path = require('path')
const { prompt } = require('inquirer')
const nodePlop = require('node-plop')

const { handleError } = require('./core')
const githubApi = require('./githubApi')
const { installPlugins } = require('./plugin')
const { saveConfiguration } = require('./project')

const BASE_PATH = process.cwd()
const GENERATORS_PATH = path.resolve(__dirname, '../generators/index.js')

function enterProjectName() {
  return prompt([{
    type: 'input',
    name: 'projectName',
    message: 'Enter project name:',
  }])
}

function selectInstallPlugins(plugins) {
  return prompt([{
    type: 'checkbox',
    message: 'Select install plugins:',
    name: 'installPluginsNames',
    choices: plugins,
  }])
}

async function generateProject(projectName, installPluginsNames, plugins) {
  const plop = nodePlop(GENERATORS_PATH)
  await plop.getGenerator('project').runActions({ projectName })

  const projectPath = path.resolve(BASE_PATH, `./${projectName}`)
  const pluginsPath = `${projectPath}/packages`

  fs.ensureDirSync(pluginsPath)

  installPlugins(installPluginsNames, plugins, [], pluginsPath)

  saveConfiguration({
    plugins: installPluginsNames,
    pluginsPath: './packages',
  }, projectPath)

  console.log(`Project "${projectName}" successfully generated!`)
}

function performProjectName(projectName) {
  return projectName.replace(/\s+/g, '-').toLowerCase()
}

async function create(...args) {
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
