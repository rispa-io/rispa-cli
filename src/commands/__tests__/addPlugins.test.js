jest.resetAllMocks()
jest.resetModules()

jest.mock('../../utils/githubApi', () => require.requireActual('../../utils/__mocks__/githubApi'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { CONFIGURATION_PATH, PLUGIN_GIT_PREFIX } = require.requireActual('../../constants')

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

  it('should success add plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath: path.resolve(cwd, './packages'),
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([
      {
        name: pluginName,
        clone_url: pluginRemoteUrl,
      },
    ])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, 'master'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])
  })

  it('should success add select plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath: path.resolve(cwd, './packages'),
        plugins: [],
        remotes: {},
      },
    })

    mockGithubApi.setMockPlugins([
      {
        name: pluginName,
        clone_url: pluginRemoteUrl,
      },
    ])

    mockInquirer.setMockAnswers({
      selectedPlugins: [pluginName],
    })

    const addPluginsCommand = new AddPluginsCommand([])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, 'master'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])
  })

  it('should success add plugin via git url', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath: path.resolve(cwd, './packages'),
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
    expect(crossSpawnCalls[2]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, 'master'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['commit', '-m', `Add plugins: ${pluginName}`], crossSpawnOptions])
  })

  it('should skip add plugin - already exist', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath: path.resolve(cwd, './packages'),
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockGithubApi.setMockPlugins([
      {
        name: pluginName,
        clone_url: pluginRemoteUrl,
      },
    ])

    const addPluginsCommand = new AddPluginsCommand([pluginName])
    addPluginsCommand.init()

    await expect(addPluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['npm', ['run', 'bs'], crossSpawnOptions])
  })

  it('should failed add plugin - cant find plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath: path.resolve(cwd, './packages'),
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
        pluginsPath: path.resolve(cwd, './packages'),
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
})
