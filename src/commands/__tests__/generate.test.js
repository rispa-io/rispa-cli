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
    const run = jest.fn(() => Promise.resolve({}))
    mockGenerator.setMockGenerators({
      [generatorName]: {
        runPrompts: jest.fn(() => Promise.resolve({})),
        runActions: run,
      },
    })
    return run
  }

  it('should success run generator', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()

    const generatorRun = mockGeneratorRun()

    await expect(runCommand([generatorName, pluginName]))
      .resolves.toBeDefined()

    expect(generatorRun).toBeCalled()
  })

  it('should success feature generator', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()

    mockInquirer.setMockAnswers({
      pluginName,
      generatorName,
    })

    const run = jest.fn(() => Promise.resolve({}))
    mockGenerator.setMockGenerators({
      [generatorName]: {
        isFeatureGenerator: true,
        runPrompts: jest.fn(() => Promise.resolve({})),
        runActions: run,
      },
    })

    await expect(runCommand([]))
      .resolves.toBeDefined()

    expect(run).toBeCalled()
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

    await expect(runCommand([generatorName, 'other-plugin']))
      .rejects.toHaveProperty('message', `Can't find plugin with name ${chalk.cyan('other-plugin')}`)
  })

  it('should failed run generator - cant find generators', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()
    mockGenerator.setMockGenerators({})

    await expect(runCommand([generatorName, pluginName]))
      .rejects.toHaveProperty('message', 'Can\'t find generators')
  })

  it('should failed run generator - cant find generator', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()
    mockGeneratorRun()

    await expect(runCommand(['unknown-generator', pluginName]))
      .rejects.toHaveProperty('message', `Can't find generator with name ${chalk.cyan('unknown-generator')}`)
  })

  it('should catch error from plop', async () => {
    mockReadConfigurationTask()
    mockScanPlugins()

    const failure = { path: 'path', error: 'error' }
    mockGenerator.setMockGenerators({
      [generatorName]: {
        runPrompts: jest.fn(() => Promise.resolve({})),
        runActions: jest.fn(() => Promise.resolve({ failures: [failure] })),
      },
    })

    await expect(runCommand([generatorName, pluginName]))
      .rejects.toHaveProperty('message', 'path: error')
  })
})
