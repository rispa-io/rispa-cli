jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/scanPlugins')
jest.mock('inquirer')

const path = require.requireActual('path')
const chalk = require.requireActual('chalk')
const { PLUGIN_GENERATORS_PATH } = require.requireActual('../../constants')

const mockInquirer = require.requireMock('inquirer')
const mockGenerator = require.requireMock('@rispa/generator')
const scanPlugins = require.requireMock('../../tasks/scanPlugins')
const readProjectConfiguration = require.requireMock('../../tasks/readProjectConfiguration')

const GenerateCommand = require.requireActual('../generate')

describe('generate', () => {
  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const args = [1, 2, 'test']
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)
  const generatorName = 'generatorName'
  const generatorsPath = path.resolve(pluginPath, PLUGIN_GENERATORS_PATH)
  const configuration = {
    pluginsPath,
    plugins: [pluginName],
    remotes: {
      [pluginName]: pluginRemoteUrl,
    },
  }

  const runCommand = params => {
    const command = new GenerateCommand(params, { renderer: 'silent' })
    command.init()
    return command.run({
      cwd,
      projectPath: cwd,
    })
  }

  const mockReadConfigurationTask = () => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = configuration
    })
  }

  const mockScanPlugins = () => {
    scanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
        generators: generatorsPath,
      },
    })
  }

  const mockGeneratorRun = () => {
    const run = jest.fn()
    mockGenerator.setMockGenerators({
      [generatorName]: {
        runActions: run,
      },
    })
    return run
  }

  it('should success run generator', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()

    const generatorRun = mockGeneratorRun()

    await expect(runCommand([pluginName, generatorName, ...args]))
      .resolves.toBeDefined()

    expect(generatorRun.mock.calls[0][0]).toHaveProperty('configuration', configuration)
    expect(generatorRun.mock.calls[0][0]).toHaveProperty('projectPath', cwd)
    expect(generatorRun.mock.calls[0][0]).toHaveProperty('args', args)
  })

  it('should success run selected generator', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()
    mockInquirer.setMockAnswers({
      pluginName,
      generatorName,
    })

    const generatorRun = mockGeneratorRun()

    await expect(runCommand([])).resolves.toBeDefined()

    expect(generatorRun).toBeCalled()
  })

  it('should failed run generator - cant find plugin', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()
    mockInquirer.setMockAnswers({
      pluginName,
      generatorName,
    })

    await expect(runCommand(['other-plugin', generatorName]))
      .rejects.toHaveProperty('message', `Can't find plugin with name ${chalk.cyan('other-plugin')}`)
  })

  it('should failed run generator - cant find generators', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()
    mockGenerator.setMockGenerators({})

    await expect(runCommand([pluginName, generatorName]))
      .rejects.toHaveProperty('message', 'Can\'t find generators')
  })

  it('should failed run generator - cant find generator', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()
    mockGeneratorRun()

    await expect(runCommand([pluginName, 'unknown-generator']))
      .rejects.toHaveProperty('message', `Can't find generator with name ${chalk.cyan('unknown-generator')}`)
  })
})
