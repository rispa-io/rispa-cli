const path = require('path')

jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../../core')
jest.mock('../../githubApi')

const mockFs = require.requireMock('fs-extra')
const mockInquirer = require.requireMock('inquirer')
const mockCore = require.requireMock('../../core')
const mockGithubApi = require.requireMock('../../githubApi')

const updatePlugins = require.requireActual('../updatePlugins')

describe('update plugins', () => {
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
      installPluginsNames: pluginsNames,
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

    mockFs.setMockFiles([])
    mockInquirer.setMockAnswers({})
    mockCore.setMockModules({})
    mockGithubApi.setMockPlugins([])
  })

  it('should success update plugins', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })
    mockFs.setMockFiles(pluginsNames.map(pluginName =>
      `${path.resolve(pluginsPath)}/${pluginName}/.git`
    ))

    await expect(updatePlugins())
      .rejects.toBe(1)

    pluginsNames.forEach(pluginName =>
      expect(consoleLog).toBeCalledWith(`Update plugin with name: ${pluginName}`)
    )
  })

  it('should failed update plugins - project config not found', async () => {
    mockCore.setMockModules({})

    await expect(updatePlugins())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })
})
