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

    mockFs.setMockFiles([])
    mockInquirer.setMockAnswers({})
    mockCore.setMockModules({})
    mockGithubApi.setMockPlugins([])
  })

  it('should success update plugins', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
      }),
    })
    mockFs.setMockFiles(pluginsNames.map(pluginName => `${pluginsPath}/${pluginName}/.git`))

    await expect(updatePlugins())
      .rejects.toBe(1)
  })

  it('should failed update plugins - project config not found', async () => {
    mockCore.setMockModules({})

    await expect(updatePlugins())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })
})
