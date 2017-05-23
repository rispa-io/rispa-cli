

const fs = require('fs')
const path = require('path')
const spawn = require('cross-spawn')
const { prompt } = require('inquirer')
const nodePlop = require('node-plop')

const { handleError } = require('./core')
const githubApi = require('./githubApi')
const { cloneRepository } = require('./git')

const BASE_PATH = process.cwd()
const GENERATORS_PATH = path.resolve(__dirname, '../generators/index.js')

async function create(projectName, ...args) {
  try {
    if (!projectName) {
      projectName = (await enterProjectName()).projectName
    }

    projectName = projectName.replace(/\s+/g, '-').toLowerCase()

    const { data: { items: plugins } } = await githubApi.plugins()

    const { installPluginsNames } = await selectInstallPlugins(plugins)

    const plop = nodePlop(GENERATORS_PATH)
    const results = await plop.getGenerator('project').runActions({ projectName })

    const pluginsPath = path.resolve(BASE_PATH, `./${projectName}/packages`)

    if (!fs.existsSync(pluginsPath)) {
      fs.mkdirSync(pluginsPath)
    }

    installPlugins(installPluginsNames, plugins, pluginsPath)

    console.log(`Project "${projectName}" successfully generated!`)
    process.exit(1)
  } catch (e) {
    handleError(e)
  }
}

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

function installPlugins(pluginsNames, plugins, path) {
  plugins.filter(({ name }) => pluginsNames.indexOf(name) !== -1)
    .forEach(({ name, clone_url: cloneUrl }) => {
      console.log(`Install plugin: ${name}`)

      cloneRepository(cloneUrl, path)
    })
}

module.exports = create
