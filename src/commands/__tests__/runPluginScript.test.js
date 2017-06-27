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
  beforeEach(() => {
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

  const runCommand = (params, options) => {
    const command = new RunPluginScriptCommand(params, { renderer: 'silent' })
    command.init()
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  it('should success run', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [scriptName],
        path: pluginPath,
      },
    })

    await expect(runCommand([pluginName, scriptName, ...args]))
      .resolves.toBeDefined()

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

    await expect(runCommand([pluginName, scriptName, ...args], { yarn: true }))
      .resolves.toBeDefined()

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

    await expect(runCommand([])).resolves.toBeDefined()

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

    await expect(runCommand([ALL_PLUGINS, scriptName, ...args]))
      .resolves.toBeDefined()

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

    await expect(runCommand([ALL_PLUGINS, scriptName, ...args]))
      .rejects.toHaveProperty('message', `Can't find script '${scriptName}' in plugins`)
  })

  it('should failed run - cant find plugins', async () => {
    mockScanPlugins.setMockPlugins({})

    await expect(runCommand([pluginName, scriptName]))
      .rejects.toHaveProperty('message', 'Can\'t find plugins')
  })

  it('should failed run - cant find plugin', async () => {
    mockScanPlugins.setMockPlugins({
      plugin1: {
        name: 'plugin1',
        scripts: [],
        path: '/',
      },
    })

    await expect(runCommand([pluginName, scriptName]))
      .rejects.toHaveProperty('message', 'Can\'t find plugin')
  })

  it('should failed run - cant find script with name', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
      },
    })

    await expect(runCommand([pluginName, scriptName]))
      .rejects.toHaveProperty('message', `Can't find script '${scriptName}' in plugin with name '${pluginName}'`)
  })

  it('should failed run with select plugin - cant find plugins with scripts', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
      },
    })

    await expect(runCommand([]))
      .rejects.toHaveProperty('message', 'Can\'t find plugins with scripts')
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

    await expect(runCommand([pluginName, scriptName, ...args]))
      .rejects.toHaveProperty('errors.0.message', 'Failed run plugin script')
  })
})
