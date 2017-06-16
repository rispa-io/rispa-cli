jest.resetAllMocks()
jest.mock('cross-spawn')

const { installPlugins } = require.requireActual('../plugin')

describe('manipulation with plugins', () => {
  let originalConsoleLog

  const plugins = [
    { name: 'rispa-core', clone_url: '/rispa-core-url' },
    { name: 'rispa-server', clone_url: '/rispa-server-url' },
  ]

  beforeAll(() => {
    originalConsoleLog = console.log
  })

  afterEach(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  afterAll(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  it('should success install plugins', () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    installPlugins(plugins, '/path', './plugins')

    expect(consoleLog).toBeCalledWith('Install plugin with name: rispa-core')
    expect(consoleLog).toBeCalledWith('Install plugin with name: rispa-server')
  })

  it('should success install plugins in dev mode', () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    installPlugins(plugins, '/path', './plugins', 'dev')

    expect(consoleLog).toBeCalledWith('Install plugin with name: rispa-core')
    expect(consoleLog).toBeCalledWith('Install plugin with name: rispa-server')
  })
})
