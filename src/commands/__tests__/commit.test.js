jest.resetAllMocks()
jest.resetModules()

jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('../../tasks/scanPlugins', () => require.requireActual('../../tasks/__mocks__/scanPlugins'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { CONFIGURATION_PATH, DEV_MODE } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')

const CommitCommand = require.requireActual('../commit')

describe('commit', () => {
  let originalConsoleLog

  beforeAll(() => {
    originalConsoleLog = console.log
    Object.defineProperty(console, 'log', {
      value: jest.fn(),
    })
  })

  afterAll(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
    mockInquirer.setMockAnswers({})
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)
  const commitMessage = 'Test commit message'
  const crossSpawnOptions = { cwd, stdio: 'inherit' }
  const crossSpawnPluginOptions = { cwd: pluginPath, stdio: 'inherit' }

  const runCommand = () => {
    const command = new CommitCommand({ renderer: 'silent' })
    command.init()
    return command.run({
      cwd,
    })
  }

  it('should commit changes', async () => {
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
      commitMessage,
    })

    const changes = 'M test.js'
    mockCrossSpawn.setMockOutput([null, new Buffer(changes)])

    await expect(runCommand()).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['commit', '-m', commitMessage], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['push'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(4)
  })

  it('should commit changes in dev mode', async () => {
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

    mockInquirer.setMockAnswers({
      commitMessage,
    })

    const changes = 'M test.js'
    mockCrossSpawn.setMockOutput([null, new Buffer(changes)])

    await expect(runCommand()).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd: pluginPath, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnPluginOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', commitMessage], crossSpawnPluginOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['push'], crossSpawnPluginOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[6]).toEqual(['git', ['commit', '-m', commitMessage], crossSpawnOptions])
    expect(crossSpawnCalls[7]).toEqual(['git', ['push'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(8)
  })

  it('should not commit if there are no changes', async () => {
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

    mockInquirer.setMockAnswers({
      commitMessage,
    })

    await expect(runCommand()).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd: pluginPath, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should not commit if commit message is empty', async () => {
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

    mockInquirer.setMockAnswers({
      commitMessage: '',
    })

    const changes = 'M test.js'
    mockCrossSpawn.setMockOutput([null, new Buffer(changes)])

    await expect(runCommand()).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd: pluginPath, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should failed commit changes', async () => {
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
      commitMessage,
    })

    const changes = 'M test.js'
    mockCrossSpawn.sync
      .mockImplementationOnce(() => ({
        status: 0,
        output: [null, new Buffer(changes)],
      }))
      .mockImplementationOnce(() => ({ status: 0 }))

    mockCrossSpawn.setMockReject(true)

    await expect(runCommand())
      .rejects.toHaveProperty('message', 'Failed git commit')

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['commit', '-m', commitMessage], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(3)
  })

  it('should failed commit changes', async () => {
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
      commitMessage,
    })

    const changes = 'M test.js'
    mockCrossSpawn.sync
      .mockImplementationOnce(() => ({
        status: 0,
        output: [null, new Buffer(changes)],
      }))
      .mockImplementationOnce(() => ({ status: 0 }))
      .mockImplementationOnce(() => ({ status: 0 }))

    mockCrossSpawn.setMockReject(true)

    await expect(runCommand())
      .rejects.toHaveProperty('message', 'Failed git push')

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls

    expect(crossSpawnCalls[0]).toEqual(['git', ['status', '--porcelain'], { cwd, stdio: 'pipe' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['commit', '-m', commitMessage], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['push'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(4)
  })
})
