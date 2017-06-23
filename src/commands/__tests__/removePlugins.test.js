jest.resetAllMocks()
jest.resetModules()

jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { CONFIGURATION_PATH } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')

const RemovePluginsCommand = require.requireActual('../removePlugins')

describe('remove project', () => {
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

  it('should success remove plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    const removePluginsCommand = new RemovePluginsCommand([pluginName])
    removePluginsCommand.init()

    await expect(removePluginsCommand.run({
      cwd,
    }).catch(e => console.error(e))).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'rm', pluginName], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', `Remove plugins: ${pluginName}`], crossSpawnOptions])
  })

  it('should success remove plugin', async () => {
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

    const removePluginsCommand = new RemovePluginsCommand([])
    removePluginsCommand.init()

    await expect(removePluginsCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'rm', pluginName], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', `Remove plugins: ${pluginName}`], crossSpawnOptions])
  })

  it('should failed remove plugin - cant find plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    const removePluginsCommand = new RemovePluginsCommand([pluginName])
    removePluginsCommand.init()

    await expect(removePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', `Can't find plugins with names:\n - ${pluginName}`)
  })

  it('should failed remove plugin - tree has modifications', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer('M test.js')])

    const removePluginsCommand = new RemovePluginsCommand([pluginName])
    removePluginsCommand.init()

    await expect(removePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Working tree has modifications. Cannot remove plugins')
  })

  it('should failed remove plugin - error during remove', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockFs.setMockRemoveCallback({
      [path.resolve(pluginsPath, `./${pluginName}`)]: () => {
        throw new Error()
      },
    })

    const removePluginsCommand = new RemovePluginsCommand([pluginName])
    removePluginsCommand.init()

    await expect(removePluginsCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Something went wrong')
  })
})
