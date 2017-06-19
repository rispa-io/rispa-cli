jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('cross-spawn')
jest.mock('../../packages')

const mockInquirer = require.requireMock('inquirer')
const mockPackages = require.requireMock('../../packages')
const mockCrossSpawn = require.requireMock('cross-spawn')

const numerate = require.requireActual('../numerate')

describe('numerate command', () => {
  let originalConsoleLog

  const packages = [
    {
      name: 'rispa-core',
      path: '/rispa-core',
    },
    {
      name: 'rispa-eslint-config',
      path: '/rispa-eslint-config',
    },
  ]

  beforeAll(() => {
    originalConsoleLog = console.log

    mockPackages.setMockPackages(packages)
  })

  afterEach(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })

    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
  })

  afterAll(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  it('should report on no version tag found for plugin', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    const tagDescription = ''
    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      commitMessage: '',
    })

    await numerate()

    expect(consoleLog).toBeCalledWith(`No version tag found for ${packages[0].name}`)
    expect(consoleLog).toBeCalledWith(`No version tag found for ${packages[1].name}`)
  })

  it('should report on incorrect version tag', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    const tagDescription = 'v123123'
    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    mockInquirer.setMockAnswers({
      commitMessage: '',
    })

    await numerate()

    expect(consoleLog).toBeCalledWith(`No version tag found for ${packages[0].name}`)
    expect(consoleLog).toBeCalledWith(`No version tag found for ${packages[1].name}`)
  })

  it('should do nothing if no new commits', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    const tagDescription = 'v1.0.0-0-aaaaaaaa'
    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    await numerate()

    expect(consoleLog).toBeCalledWith('No plugins to be numerated')
  })

  it('should add tag for all packages', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    const tagDescription = 'v2.4.11-2-aaaaaaaa'
    mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

    const nextVersion = '2.4.12'
    mockInquirer.setMockAnswers({
      nextVersion,
    })

    await numerate()

    expect(mockInquirer.prompt.mock.calls[0][0][0].choices).toEqual([
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

    expect(consoleLog).toBeCalledWith(`2 new commit(s) for plugin '${packages[0].name}' after 2.4.11`)
    expect(consoleLog).toBeCalledWith(`2 new commit(s) for plugin '${packages[1].name}' after 2.4.11`)

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls.slice(2)
    expect(crossSpawnCalls[0]).toEqual(['git', ['tag', `v${nextVersion}`], { cwd: packages[1].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['push', '--tags'], { cwd: packages[1].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[2]).toEqual(['git', ['tag', `v${nextVersion}`], { cwd: packages[0].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[3]).toEqual(['git', ['push', '--tags'], { cwd: packages[0].path, stdio: 'inherit' }])
  })
})
