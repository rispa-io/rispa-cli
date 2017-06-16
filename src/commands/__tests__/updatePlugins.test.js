const path = require('path')

jest.resetAllMocks()
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../../core')

const mockFs = require.requireMock('fs-extra')
const mockCore = require.requireMock('../../core')

const updatePlugins = require.requireActual('../updatePlugins')

describe('update plugins', () => {
  let originalExit
  let originalConsoleLog

  const pluginsNames = ['rispa-core', 'rispa-eslint-config']
  const pluginsPath = './plugins'
  const projectConfigPath = path.resolve(process.cwd(), './.rispa.json')
  const projectConfig = {
    plugins: [],
    pluginsPath,
  }
  const remotes = {
    'rispa-core': '/rispa-core-remote',
    'rispa-eslint-config': '/rispa-eslint-config-remote',
  }

  beforeAll(() => {
    originalExit = process.exit
    originalConsoleLog = console.log

    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })

    mockFs.setMockFiles([])
    mockCore.setMockModules({})
  })

  it('should success update plugins', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: pluginsNames,
        pluginsPath,
        remotes,
      }),
    })

    await expect(updatePlugins())
      .rejects.toBe(1)

    pluginsNames.forEach(pluginName =>
      expect(consoleLog).toBeCalledWith(
        `Update plugin subtree with name: ${pluginName}`
      )
    )
  })

  it('should success update plugins in dev mode', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        mode: 'dev',
        plugins: pluginsNames,
        pluginsPath,
      }),
    })
    mockFs.setMockFiles([
      `${path.resolve(pluginsPath)}/${pluginsNames[0]}/.git`,
    ])

    await expect(updatePlugins())
      .rejects.toBe(1)

    expect(consoleLog).toBeCalledWith(
      `Update plugin repository with name: ${pluginsNames[0]}`
    )
  })

  it('should failed update plugins - project config not found', async () => {
    mockCore.setMockModules({})

    await expect(updatePlugins())
      .rejects.toHaveProperty('message', 'Can\'t find rispa project config')
  })

  it('should failed update plugins - no plugins to update', async () => {
    mockCore.setMockModules({
      [projectConfigPath]: Object.assign({}, projectConfig, {
        plugins: [],
        pluginsPath,
      }),
    })

    await expect(updatePlugins())
      .rejects.toHaveProperty('message', 'No plugins to update')
  })
})
