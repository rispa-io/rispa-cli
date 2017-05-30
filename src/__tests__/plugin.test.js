jest.resetAllMocks()
jest.mock('cross-spawn')

const { installPlugins } = require.requireActual('../plugin')

describe('manipulation with plugins', () => {
  let originalConsoleLog

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

    const installPluginsNames = ['core', 'eslint-config']
    const plugins = installPluginsNames.map(name => ({
      name, clone_url: 'url',
    }))
    const installedPluginsNames = ['core']

    expect(installPlugins(installPluginsNames, plugins, installedPluginsNames, 'path')).toHaveLength(1)

    expect(consoleLog).toBeCalledWith('Already installed plugin with name: core')
    expect(consoleLog).toBeCalledWith('Install plugin with name: eslint-config')
  })
})
