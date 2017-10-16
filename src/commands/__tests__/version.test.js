jest.mock('../../utils/plugin')

const { readPackageJson } = require.requireMock('../../utils/plugin')

const VersionCommand = require.requireActual('../version')

describe('get version', () => {
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
    console.log.mockClear()
  })

  const version = '1.0.0'

  const runCommand = options => {
    const command = new VersionCommand({ renderer: 'silent' })
    return command.run(Object.assign({
      cwd: '',
    }, options))
  }

  it('should success print version', async () => {
    readPackageJson.mockImplementationOnce(() => ({
      version,
    }))

    await expect(runCommand()).resolves.toBeDefined()

    expect(console.log).toBeCalledWith(`v${version}`)
  })
})
