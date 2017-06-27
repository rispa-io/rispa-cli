jest.resetAllMocks()
jest.resetModules()

jest.mock('../../utils/githubApi', () => require.requireActual('../../utils/__mocks__/githubApi'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const chalk = require.requireActual('chalk')
const { CONFIGURATION_PATH, PLUGIN_GIT_PREFIX, DEFAULT_PLUGIN_BRANCH, DEV_MODE } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGithubApi = require.requireMock('../../utils/githubApi')

const AddPluginsCommand = require.requireActual('../addPlugins')

describe('add plugins', () => {
  let originalConsoleLog

  beforeAll(() => {
    originalConsoleLog = console.log
  })

  afterAll(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  beforeEach(() => {
    Object.defineProperty(console, 'log', {
      value: jest.fn(),
    })

    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
    mockInquirer.setMockAnswers({})
    mockGithubApi.setMockPlugins([])
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const crossSpawnOptions = { cwd, stdio: 'inherit' }
  const pluginsPath = path.resolve(cwd, './packages')

  it('should success add plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
      projectPath: cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(6)
  })

  it('should success add select plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    mockInquirer.setMockAnswers({
      selectedPlugins: [{
        name: pluginName,
        cloneUrl: pluginRemoteUrl,
      }],
    })

    const addPluginsCommand = new AddPluginsCommand([])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(6)
  })

  it('should success add plugin in dev mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['clone', pluginRemoteUrl], { cwd: pluginsPath, stdio: 'inherit' }])
    expect(crossSpawnCalls[1]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should failed add plugin in dev mode - cant clone repository', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockCrossSpawn.setMockReject(true)

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('errors.0.message', 'Can\'t clone repository')

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['clone', pluginRemoteUrl], { cwd: pluginsPath, stdio: 'inherit' }])
    expect(crossSpawnCalls[1]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should success add plugin and bootstrap via yarn', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
      yarn: true,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['yarn', ['bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(6)
  })

  it('should success add plugin via git url', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    const addPluginsCommand = new AddPluginsCommand([`${PLUGIN_GIT_PREFIX}${pluginRemoteUrl}`])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(6)
  })

  it('should skip add plugin - already exist', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should failed add plugin - cant find plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', `Can't find plugins with names:\n - ${pluginName}`)
  })

  it('should failed add plugin - tree has modifications', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([])

    mockCrossSpawn.setMockOutput([null, new Buffer('M test.js')])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Working tree has modifications. Cannot add plugins')
  })

  it('should failed add plugin - cant find plugins for select', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      clone_url: pluginRemoteUrl,
    }])

    const addPluginsCommand = new AddPluginsCommand([])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Can\'t find plugins for select')
  })

  it('should failed add plugin - invalid git url', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    const invalidRemoteUrl = '/invalid-url'

    const addPluginsCommand = new AddPluginsCommand([`${PLUGIN_GIT_PREFIX}${invalidRemoteUrl}`])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('errors.0.message', `Invalid plugin remote url ${chalk.cyan(invalidRemoteUrl)}`)

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['npm', ['run', 'bs'], { cwd, stdio: 'inherit' }])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should failed add plugin - configuration not found', async () => {
    mockFs.setMockJson({})

    const addPluginsCommand = new AddPluginsCommand([])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })
})
