jest.resetAllMocks()
jest.resetModules()

jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { CONFIGURATION_PATH, DEFAULT_PLUGIN_BRANCH, ALL_PLUGINS, DEV_MODE } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')

const UpdatePluginsCommand = require.requireActual('../updatePlugins')

describe('update plugins', () => {
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
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
    mockFs.setMockRemoveCallback(() => {
    })
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const crossSpawnOptions = { cwd, stdio: 'inherit' }
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)

  const expectSuccessUpdateSinglePlugin = crossSpawnCalls => {
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual([
      'git',
      ['subtree', 'pull', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions],
    )
    expect(crossSpawnCalls[3]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['commit', '-m', `Update plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(5)
  }

  it('should success update single plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    const updatePluginsCommand = new UpdatePluginsCommand([pluginName])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    expectSuccessUpdateSinglePlugin(mockCrossSpawn.sync.mock.calls)
  })

  it('should failed update single plugin in dev mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    const updatePluginsCommand = new UpdatePluginsCommand([pluginName])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('errors.0.message', 'Not a git repository: .git')
  })

  it('should success update single plugin in dev mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        mode: DEV_MODE,
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockFs.setMockFiles([path.resolve(pluginPath, './.git')])

    const updatePluginsCommand = new UpdatePluginsCommand([pluginName])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['pull'], { cwd: pluginPath, stdio: 'inherit' }])

    expect(crossSpawnCalls.length).toBe(1)
  })

  it('should success update all plugins', async () => {
    const pluginName2 = 'rispa-config'
    const pluginRemoteUrl2 = `https://git.com/${pluginName2}.git`
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName, pluginName2],
        remotes: {
          [pluginName]: pluginRemoteUrl,
          [pluginName2]: pluginRemoteUrl2,
        },
      },
    })

    const updatePluginsCommand = new UpdatePluginsCommand([ALL_PLUGINS])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual([
      'git',
      ['subtree', 'pull', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions],
    )
    expect(crossSpawnCalls[3]).toEqual(['git', ['remote', 'add', pluginName2, pluginRemoteUrl2], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual([
      'git',
      ['subtree', 'pull', `--prefix=packages/${pluginName2}`, pluginName2, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions],
    )
    expect(crossSpawnCalls[5]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[6]).toEqual(['git', ['commit', '-m', `Update plugins: ${pluginName}, ${pluginName2}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(7)
  })

  it('should success update selected plugins', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockInquirer.setMockAnswers({
      selectedPlugins: [pluginName],
    })

    const updatePluginsCommand = new UpdatePluginsCommand([])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    expectSuccessUpdateSinglePlugin(mockCrossSpawn.sync.mock.calls)
  })

  it('should failed update plugins - cant find plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    const updatePluginsCommand = new UpdatePluginsCommand([pluginName])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', `Can't find plugins with names:\n - ${pluginName}`)
  })

  it('should failed update plugins - tree has modifications', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer('M test.js')])

    const updatePluginsCommand = new UpdatePluginsCommand([pluginName])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Working tree has modifications. Cannot update plugins')
  })

  it('should failed update plugin - failed update subtree', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockCrossSpawn.setMockReject(true)

    const updatePluginsCommand = new UpdatePluginsCommand([pluginName])
    updatePluginsCommand.init()

    await expect(updatePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('errors.0.message', `Failed update subtree '${pluginRemoteUrl}'`)
  })
})
