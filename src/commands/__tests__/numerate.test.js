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

const NumerateCommand = require.requireActual('../numerate')

describe('numerate', () => {
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
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)
  const crossSpawnOptions = { cwd, stdio: 'inherit' }
  const crossSpawnPluginOptions = { cwd: pluginPath, stdio: 'inherit' }
  const tagDescription = 'v2.4.11-2-aaaaaaaa'
  const nextVersion = '2.4.12'

  it('should numerate project', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      nextVersion,
    })

    const numerateCommand = new NumerateCommand([])
    numerateCommand.init()

    await expect(numerateCommand.run({
      cwd,
    })).resolves.toBeDefined()

    expect(mockInquirer.prompt.mock.calls[0][0][0].choices).toEqual([
      {
        name: 'Cancel select',
        value: false,
      },
      {
        name: 'PATCH 2.4.12',
        value: '2.4.12',
      },
      {
        name: 'MINOR 2.5.0',
        value: '2.5.0',
      },
      {
        name: 'MAJOR 3.0.0',
        value: '3.0.0',
      },
    ])

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd, stdio: 'pipe' },
    ])
    expect(crossSpawnCalls[1]).toEqual(['git', ['tag', `v${nextVersion}`], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['push', '--tags'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(3)
  })

  it('should numerate in dev mode ', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      nextVersion,
    })

    const numerateCommand = new NumerateCommand([])
    numerateCommand.init()

    await expect(numerateCommand.run({
      cwd,
      mode: DEV_MODE,
    }).catch(e => console.error(e))).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd: pluginPath, stdio: 'pipe' },
    ])
    expect(crossSpawnCalls[1]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd, stdio: 'pipe' },
    ])
    expect(crossSpawnCalls[2]).toEqual(['git', ['tag', `v${nextVersion}`], crossSpawnPluginOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['push', '--tags'], crossSpawnPluginOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['tag', `v${nextVersion}`], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['push', '--tags'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(6)
  })

  it('should cancel numerate in dev mode', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      nextVersion: false,
    })

    const numerateCommand = new NumerateCommand([])
    numerateCommand.init()

    await expect(numerateCommand.run({
      cwd,
      mode: DEV_MODE,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd: pluginPath, stdio: 'pipe' },
    ])
    expect(crossSpawnCalls[1]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd, stdio: 'pipe' },
    ])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should failed numerate - failed git add tag', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      nextVersion,
    })

    mockCrossSpawn.sync
      .mockImplementationOnce(() => ({
        status: 0,
        output: [null, new Buffer(tagDescription)],
      }))

    mockCrossSpawn.setMockReject(true)

    const numerateCommand = new NumerateCommand([])
    numerateCommand.init()

    await expect(numerateCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Failed git add tag')

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd, stdio: 'pipe' },
    ])
    expect(crossSpawnCalls[1]).toEqual(['git', ['tag', `v${nextVersion}`], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(2)
  })

  it('should failed numerate in dev mode - cant find tags', async () => {
    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      nextVersion,
    })

    mockCrossSpawn.sync
      .mockImplementationOnce(() => ({
        status: 1,
        output: [null, new Buffer('')],
      }))
      .mockImplementationOnce(() => ({
        status: 0,
        output: [null, new Buffer('')],
      }))

    const numerateCommand = new NumerateCommand([])
    numerateCommand.init()

    await expect(numerateCommand.run({
      cwd,
      mode: DEV_MODE,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd: pluginPath, stdio: 'pipe' },
    ])
    expect(crossSpawnCalls[1]).toEqual([
      'git',
      ['describe', '--tags', '--long', '--match', 'v*'],
      { cwd, stdio: 'pipe' },
    ])

    expect(crossSpawnCalls.length).toBe(2)
  })
})
