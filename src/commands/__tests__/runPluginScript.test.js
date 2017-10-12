jest.mock('../../tasks/scanPlugins')
jest.mock('../../tasks/runPluginScript')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { ALL_PLUGINS, CONFIGURATION_PATH } = require.requireActual('../../constants')

const scanPlugins = require.requireMock('../../tasks/scanPlugins')
const createRunPluginScript = require.requireMock('../../tasks/runPluginScript')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')

const RunPluginScriptCommand = require.requireActual('../runPluginScript')

describe('run plugin script', () => {
  const cwd = '/cwd'
  const pluginName = 'pluginName'
  const scriptName = 'scriptName'
  const pluginPath = path.resolve(cwd, `./${pluginName}`)
  const args = [1, 2, 'test']
  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const plugin = {
    name: pluginName,
    packageAlias: pluginName,
    scripts: [scriptName],
    path: pluginPath,
  }

  mockFs.setMockJson({
    [rispaJsonPath]: {
      pluginsPath: '',
      plugins: [{
        name: pluginName,
      }],
    },
  })

  const runCommand = (params, options) => {
    const command = new RunPluginScriptCommand(params, { renderer: 'silent' })
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  const mockScanPlugins = () => {
    scanPlugins.setMockPlugins([
      plugin,
    ])
  }

  const mockRunScriptTask = () => {
    createRunPluginScript.mockClear()
    createRunPluginScript.mockImplementation(() => ({
      title: 'title',
      task: jest.fn(),
    }))
  }

  it('should success run', async () => {
    mockScanPlugins()
    mockRunScriptTask()

    await expect(runCommand([pluginName, scriptName, ...args]))
      .resolves.toBeDefined()

    expect(createRunPluginScript).toBeCalledWith(pluginName, pluginPath, scriptName, args)
  })

  it('should success run with select plugin and script', async () => {
    mockScanPlugins()
    mockRunScriptTask()

    mockInquirer.setMockAnswers({
      plugin,
      scriptName,
    })

    await expect(runCommand([])).resolves.toBeDefined()

    expect(createRunPluginScript).toBeCalledWith(pluginName, pluginPath, scriptName, [])
  })

  it('should success run script in all plugins', async () => {
    mockScanPlugins()
    mockRunScriptTask()

    await expect(runCommand([ALL_PLUGINS, scriptName, ...args]))
      .resolves.toBeDefined()

    expect(createRunPluginScript).toBeCalledWith(pluginName, pluginPath, scriptName, args)
  })

  it('should failed run - cant find plugins', async () => {
    scanPlugins.setMockPlugins([])

    await expect(runCommand([pluginName, scriptName]))
      .rejects.toHaveProperty('message', 'Can\'t find plugins')
  })

  it('should failed run - cant find plugin', async () => {
    mockScanPlugins()

    await expect(runCommand(['somePlugin', scriptName]))
      .rejects.toHaveProperty('message', 'Can\'t find plugin')
  })

  it('should failed run - cant find script with name', async () => {
    mockScanPlugins()

    await expect(runCommand([pluginName, 'someScript']))
      .rejects.toHaveProperty('message', `Can't find script 'someScript' in plugin with name '${pluginName}'`)
  })

  it('should failed run with select plugin - cant find plugins with scripts', async () => {
    scanPlugins.setMockPlugins([
      Object.assign({}, plugin, {
        scripts: [],
      }),
    ])

    await expect(runCommand([]))
      .rejects.toHaveProperty('message', 'Can\'t find plugins with scripts')
  })
})
