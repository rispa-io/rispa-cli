jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('cross-spawn')
jest.mock('../../packages')

const mockInquirer = require.requireMock('inquirer')
const mockPackages = require.requireMock('../../packages')
const mockCrossSpawn = require.requireMock('cross-spawn')

const commit = require.requireActual('../commit')

describe('commit command', () => {
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

  it('should do nothing if no changes', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    await commit()

    expect(consoleLog).toBeCalledWith('Nothing to commit')
  })

  it('should not commit if commit message is empty', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    const changes = 'M test.js'
    mockCrossSpawn.setMockOutput([null, new Buffer(changes)])

    mockInquirer.setMockAnswers({
      commitMessage: '',
    })

    await commit()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls.slice(2)
    expect(crossSpawnCalls).toHaveLength(0)
  })

  it('should commit changes for all packages', async () => {
    const consoleLog = jest.fn()
    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    const changes = 'M test.js'
    mockCrossSpawn.setMockOutput([null, new Buffer(changes)])

    const commitMessage = 'Test commit message'
    mockInquirer.setMockAnswers({
      commitMessage,
    })

    await commit()

    expect(consoleLog.mock.calls[0][0]).toBe(`Changes for plugin '${packages[1].name}':`)
    expect(consoleLog.mock.calls[1][0]).toBe(changes)
    expect(consoleLog.mock.calls[2][0]).toBe(`Changes for plugin '${packages[0].name}':`)
    expect(consoleLog.mock.calls[3][0]).toBe(changes)

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls.slice(2)
    expect(crossSpawnCalls[0]).toEqual(['git', ['add', '.'], { cwd: packages[1].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[1]).toEqual(['git', ['commit', '-m', commitMessage], { cwd: packages[1].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[2]).toEqual(['git', ['push'], { cwd: packages[1].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[3]).toEqual(['git', ['add', '.'], { cwd: packages[0].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[4]).toEqual(['git', ['commit', '-m', commitMessage], { cwd: packages[0].path, stdio: 'inherit' }])
    expect(crossSpawnCalls[5]).toEqual(['git', ['push'], { cwd: packages[0].path, stdio: 'inherit' }])
  })
})
