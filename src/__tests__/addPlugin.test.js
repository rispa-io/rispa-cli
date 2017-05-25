/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('node-plop')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../core')
jest.mock('../githubApi')

const inquirer = require('inquirer')
const core = require('../core')
const githubApi = require('../githubApi')

const addPlugin = require('../addPlugin')

describe('add plugin', () => {
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

    inquirer.setMockAnswers({})
    core.setMockModules({})
    githubApi.setMockPlugins([])
  })

  it('should success add plugins', async () => {
    core.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    await expect(addPlugin(...pluginsNames))
      .rejects.toBe(1)
  })

  it('should success add plugins, but plugins already installed', async () => {
    core.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    await expect(addPlugin(...pluginsNames))
      .rejects.toBe(1)
  })

  it('should success add plugins with select', async () => {
    core.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    await expect(addPlugin())
      .rejects.toBe(1)
  })

  it('should success add plugins with select and empty config', async () => {
    core.setMockModules({
      [projectConfigPath]: {},
    })

    await expect(addPlugin())
      .rejects.toBe(1)
  })

  it('should failed add plugins - plugins not found', async () => {
    core.setMockModules({
      [projectConfigPath]: projectConfig,
    })
    const notExistPlugin = 'invalid'

    await expect(addPlugin(notExistPlugin))
      .rejects.toHaveProperty('message', `Can't find plugins with names:\n - ${notExistPlugin}`)
  })

  it('should failed add plugins - cant find plugins for install', async () => {
    core.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    await expect(addPlugin())
      .rejects.toHaveProperty('message', 'Can\'t find plugins for install')
  })

  it('should failed add plugins - project config not found', async () => {
    core.setMockModules({})

    await expect(addPlugin())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })
})
