/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('node-plop')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../core')
jest.mock('../githubApi')

const fs = require('fs-extra')
const inquirer = require('inquirer')
const core = require('../core')
const githubApi = require('../githubApi')

const updatePlugins = require('../updatePlugins')

describe('update plugins', () => {
  let originalExit

  const pluginsNames = ['rispa-core', 'rispa-eslint-config']
  const pluginsPath = '/sample/path'
  const plugins = pluginsNames.map(pluginName => ({
    name: pluginName,
    clone_url: 'url',
  }))
  const projectConfigPath = `${process.cwd()}/.rispa.json`
  const projectConfig = {
    plugins: [],
    pluginsPath,
  }

  beforeAll(() => {
    originalExit = process.exit
    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })

    inquirer.setMockAnswers({
      installPluginsNames: pluginsNames,
    })
    githubApi.setMockPlugins(plugins)
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    fs.setMockFiles([])
    inquirer.setMockAnswers({})
    core.setMockModules({})
    githubApi.setMockPlugins([])
  })

  it('should success update plugins', async () => {
    core.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })
    fs.setMockFiles(pluginsNames.map(pluginName => `${pluginsPath}/${pluginName}/.git`))

    await expect(updatePlugins())
      .rejects.toBe(1)
  })

  it('should failed update plugins - project config not found', async () => {
    core.setMockModules({})

    await expect(updatePlugins())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })
})
