jest.resetAllMocks()
jest.resetModules()

jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { CONFIGURATION_PATH, DEV_MODE } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')

const RemovePluginsCommand = require.requireActual('../removePlugins')

describe('remove plugins', () => {
  beforeEach(() => {
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

  const runCommand = params => {
    const command = new RemovePluginsCommand(params, { renderer: 'silent' })
    command.init()
    return command.run({
      cwd,
    })
  }

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

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'rm', pluginName], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', `Remove plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(4)
  })

  it('should success remove plugin in dev mode', async () => {
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

    await expect(runCommand([pluginName])).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls.length).toBe(0)
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

    await expect(runCommand([])).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'rm', pluginName], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', `Remove plugins: ${pluginName}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(4)
  })

  it('should success remove multiple plugins', async () => {
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

    await expect(runCommand([pluginName, pluginName2])).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'rm', pluginName], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['remote', 'rm', pluginName2], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['commit', '-m', `Remove plugins: ${pluginName}, ${pluginName2}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(5)
  })

  it('should failed remove plugin - cant find plugin', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [],
        remotes: {},
      },
    })

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('message', `Can't find plugins with names:\n - ${pluginName}`)
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

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('message', 'Working tree has modifications. Cannot remove plugins')
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

    const errorMessage = 'errorMessage'

    mockFs.setMockRemoveCallback({
      [path.resolve(pluginsPath, `./${pluginName}`)]: () => {
        throw new Error(errorMessage)
      },
    })

    await expect(runCommand([pluginName]))
      .rejects.toHaveProperty('errors.0.message', errorMessage)
  })
})
