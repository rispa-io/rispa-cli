const path = require('path')

jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('node-plop')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../../core')
jest.mock('../../githubApi')

const mockInquirer = require.requireMock('inquirer')
const mockCore = require.requireMock('../../core')
const mockGithubApi = require.requireMock('../../githubApi')
const mockCrossSpawn = require.requireMock('cross-spawn')

const addPlugins = require.requireActual('../addPlugins')

describe('add plugins', () => {
  let originalExit
  let originalConsoleLog

  const pluginsNames = ['rispa-core', 'rispa-eslint-config']
  const pluginsPath = '/sample/path'
  const plugins = pluginsNames.map(pluginName => ({
    name: pluginName,
    clone_url: 'url',
  }))
  const projectConfigPath = path.resolve(process.cwd(), './.rispa.json')
  const projectConfig = {
    plugins: [],
    pluginsPath,
  }

  beforeAll(() => {
    originalExit = process.exit
    originalConsoleLog = console.log

    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })

    mockInquirer.setMockAnswers({
      plugins,
    })
    mockGithubApi.setMockPlugins(plugins)
  })

  afterEach(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  it('should success add plugins', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    await expect(addPlugins(...pluginsNames))
      .rejects.toBe(1)

    pluginsNames.forEach(pluginName =>
      expect(consoleLog).toBeCalledWith(`Install plugin with name: ${pluginName}`)
    )
  })

  it('should success add plugin by url', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    const clonePluginName = 'plugin-name'
    const cloneUrl = `https://test.com/${clonePluginName}.git`

    await expect(addPlugins(`git:${cloneUrl}`))
      .rejects.toBe(1)

    expect(consoleLog).toBeCalledWith(`Install plugin with name: ${clonePluginName}`)
  })

  it('should success add plugins, but plugins already installed', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    await expect(addPlugins(...pluginsNames))
      .rejects.toBe(1)

    pluginsNames.forEach(pluginName =>
      expect(consoleLog).toBeCalledWith(`Plugin '${pluginName}' already installed`)
    )
  })

  it('should success add plugins with select', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    await expect(addPlugins())
      .rejects.toBe(1)

    pluginsNames.forEach(pluginName =>
      expect(consoleLog).toBeCalledWith(`Install plugin with name: ${pluginName}`)
    )
  })

  it('should success add plugins with select and empty config', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: {},
    })

    await expect(addPlugins())
      .rejects.toBe(1)

    pluginsNames.forEach(pluginName =>
      expect(consoleLog).toBeCalledWith(`Install plugin with name: ${pluginName}`)
    )
  })

  it('should failed add plugin by url - invalid url', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    const cloneUrl = 'https://test.com/plugin-name'

    await expect(addPlugins(`git:${cloneUrl}`))
      .rejects.toHaveProperty('message', `Invalid plugin git url: ${cloneUrl}`)
  })

  it('should failed add plugins - plugins not found', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })
    const notExistPlugin = 'invalid'

    await expect(addPlugins(notExistPlugin))
      .rejects.toHaveProperty('message', `Can't find plugins with names:\n - ${notExistPlugin}`)
  })

  it('should failed add plugins - cant find plugins for install', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    await expect(addPlugins())
      .rejects.toHaveProperty('message', 'Can\'t find plugins for install')
  })

  it('should failed add plugins - project config not found', async () => {
    mockCore.setMockModules({})

    await expect(addPlugins())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })

  it('should failed add plugins - working tree has modifications', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })
    mockCrossSpawn.setMockOutput([null, new Buffer('M test.js')])

    await expect(addPlugins())
      .rejects.toHaveProperty('message', 'Working tree has modifications. Cannot add plugins')
  })
})
