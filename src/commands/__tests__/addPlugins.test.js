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

const addPlugins = require.requireActual('../addPlugins')

describe('add plugins', () => {
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

    mockInquirer.setMockAnswers({
      installPluginsNames: pluginsNames,
    })
    mockGithubApi.setMockPlugins(plugins)
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    mockInquirer.setMockAnswers({})
    mockCore.setMockModules({})
    mockGithubApi.setMockPlugins([])
  })

  it('should success add plugins', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    await expect(addPlugins(...pluginsNames))
      .rejects.toBe(1)
  })

  it('should success add plugins, but plugins already installed', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })

    await expect(addPlugins(...pluginsNames))
      .rejects.toBe(1)
  })

  it('should success add plugins with select', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: projectConfig,
    })

    await expect(addPlugins())
      .rejects.toBe(1)
  })

  it('should success add plugins with select and empty config', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: {},
    })

    await expect(addPlugins())
      .rejects.toBe(1)
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
})
