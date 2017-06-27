jest.resetAllMocks()
jest.resetModules()

jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('../../tasks/scanPlugins', () => require.requireActual('../../tasks/__mocks__/scanPlugins'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const chalk = require.requireActual('chalk')
const { CONFIGURATION_PATH, PLUGIN_GENERATORS_PATH } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGenerator = require.requireMock('@rispa/generator')
const mockScanPlugins = require.requireMock('../../tasks/scanPlugins')

const GenerateCommand = require.requireActual('../generate')

describe('generate', () => {
  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
    mockInquirer.setMockAnswers({})
    mockFs.setMockFiles([])
    mockFs.setMockJson({})
  })

  const cwd = '/cwd'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = `https://git.com/${pluginName}.git`
  const rispaJsonPath = path.resolve(cwd, CONFIGURATION_PATH)
  const args = [1, 2, 'test']
  const pluginsPath = path.resolve(cwd, './packages')
  const pluginPath = path.resolve(pluginsPath, `./${pluginName}`)
  const generatorName = 'generatorName'
  const generatorsPath = path.resolve(pluginPath, PLUGIN_GENERATORS_PATH)

  const runCommand = params => {
    const command = new GenerateCommand(params, { renderer: 'silent' })
    command.init()
    return command.run({
      cwd,
    })
  }

  it('should success run generator', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
        generators: generatorsPath,
      },
    })

    const configuration = {
      pluginsPath,
      plugins: [pluginName],
      remotes: {
        [pluginName]: pluginRemoteUrl,
      },
    }

    mockFs.setMockJson({
      [rispaJsonPath]: configuration,
    })

    const generatorRun = jest.fn(() => Promise.resolve())

    mockGenerator.setMockGenerators({
      [generatorName]: {
        runActions: generatorRun,
      },
    })

    await expect(runCommand([pluginName, generatorName, ...args]))
      .resolves.toBeDefined()

    expect(generatorRun.mock.calls[0][0]).toHaveProperty('configuration', configuration)
    expect(generatorRun.mock.calls[0][0]).toHaveProperty('projectPath', cwd)
    expect(generatorRun.mock.calls[0][0]).toHaveProperty('args', args)
  })

  it('should success run selected generator', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
        generators: generatorsPath,
      },
    })

    const configuration = {
      pluginsPath,
      plugins: [pluginName],
      remotes: {
        [pluginName]: pluginRemoteUrl,
      },
    }

    mockFs.setMockJson({
      [rispaJsonPath]: configuration,
    })

    mockInquirer.setMockAnswers({
      pluginName,
      generatorName,
    })

    const generatorRun = jest.fn(() => Promise.resolve())

    mockGenerator.setMockGenerators({
      [generatorName]: {
        runActions: generatorRun,
      },
    })

    await expect(runCommand([])).resolves.toBeDefined()

    expect(generatorRun.mock.calls[0][0]).toHaveProperty('configuration', configuration)
    expect(generatorRun.mock.calls[0][0]).toHaveProperty('projectPath', cwd)
    expect(generatorRun.mock.calls[0][0]).toHaveProperty('args', [])
  })

  it('should failed run generator - cant find plugin', async () => {
    mockScanPlugins.setMockPlugins({})

    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    await expect(runCommand([pluginName, generatorName]))
      .rejects.toHaveProperty('message', `Can't find plugin with name ${chalk.cyan(pluginName)}`)
  })

  it('should failed run generator - cant find generators', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
        generators: generatorsPath,
      },
    })

    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockGenerator.setMockGenerators({})

    await expect(runCommand([pluginName, generatorName]))
      .rejects.toHaveProperty('message', 'Can\'t find generators')
  })

  it('should failed run generator - cant find generator', async () => {
    mockScanPlugins.setMockPlugins({
      [pluginName]: {
        name: pluginName,
        scripts: [],
        path: pluginPath,
        generators: generatorsPath,
      },
    })

    mockFs.setMockJson({
      [rispaJsonPath]: {
        pluginsPath,
        plugins: [pluginName],
        remotes: {
          [pluginName]: pluginRemoteUrl,
        },
      },
    })

    mockGenerator.setMockGenerators({
      test: {},
    })

    await expect(runCommand([pluginName, generatorName]))
      .rejects.toHaveProperty('message', `Can't find generator with name ${chalk.cyan(generatorName)}`)
  })
})
