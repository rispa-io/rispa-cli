jest.resetAllMocks()
jest.resetModules()

jest.mock('../../tasks/scanPlugins', () => require.requireActual('../../tasks/__mocks__/scanPlugins'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')

const { ALL_PLUGINS } = require.requireActual('../../constants')

const mockScanPlugins = require.requireMock('../../tasks/scanPlugins')
const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')

const RunPluginScriptCommand = require.requireActual('../runPluginScript')

describe('run plugin script', () => {
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
    mockScanPlugins.setMockPlugins({})
    mockInquirer.setMockAnswers({})
  })

  const cwd = '/cwd'
  const pluginName = 'pluginName'
  const scriptName = 'scriptName'
  const pluginPath = path.resolve(cwd, `./${pluginName}`)
  const args = [1, 2, 'test']

  it('should success run', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [scriptName],
        path: pluginPath,
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([pluginName, scriptName, ...args])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).resolves.toBeDefined()

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'npm', ['run', scriptName, ...args],
      { cwd: pluginPath, stdio: 'inherit' }
    )
  })

  it('should success run via yarn', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [scriptName],
        path: pluginPath,
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([pluginName, scriptName, ...args])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
      yarn: true,
    })).resolves.toBeDefined()

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'yarn', [scriptName, ...args],
      { cwd: pluginPath, stdio: 'inherit' }
    )
  })

  it('should success run with select plugin and script', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [scriptName],
        path: pluginPath,
      },
    })

    mockInquirer.setMockAnswers({
      pluginName,
      scriptName,
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).resolves.toBeDefined()

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'npm', ['run', scriptName],
      { cwd: pluginPath, stdio: 'inherit' }
    )
  })

  it('should success run script in all plugins', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [scriptName],
        path: pluginPath,
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([ALL_PLUGINS, scriptName, ...args])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).resolves.toBeDefined()

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'npm', ['run', scriptName, ...args],
      { cwd: pluginPath, stdio: 'inherit' }
    )
  })

  it('should failed run script in all plugins - cant find script in plugins', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([ALL_PLUGINS, scriptName, ...args])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', `Can't find script '${scriptName}' in plugins`)
  })

  it('should failed run - cant find plugins', async () => {
    mockScanPlugins.setMockPlugins({})

    const runPluginScriptCommand = new RunPluginScriptCommand([pluginName, scriptName])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Can\'t find plugins')
  })

  it('should failed run - cant find plugin', async () => {
    mockScanPlugins.setMockPlugins({
      plugin1: {
        name: 'plugin1',
        scripts: [],
        path: '/',
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([pluginName, scriptName])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Can\'t find plugin')
  })

  it('should failed run - cant find script with name', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([pluginName, scriptName])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', `Can't find script '${scriptName}' in plugin with name '${pluginName}'`)
  })

  it('should failed run with select plugin - cant find plugins with scripts', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
      },
    })

    const runPluginScriptCommand = new RunPluginScriptCommand([])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Can\'t find plugins with scripts')
  })

  it('should failed run - failed run script', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [scriptName],
        path: pluginPath,
      },
    })

    mockCrossSpawn.setMockReject(true)

    const runPluginScriptCommand = new RunPluginScriptCommand([pluginName, scriptName, ...args])
    runPluginScriptCommand.init()

    await expect(runPluginScriptCommand.run({
      cwd,
    })).rejects.toHaveProperty('message', 'Something went wrong')
  })
})
