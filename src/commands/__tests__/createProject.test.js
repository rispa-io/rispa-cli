jest.resetAllMocks()
jest.resetModules()

jest.mock('../../utils/githubApi', () => require.requireActual('../../utils/__mocks__/githubApi'))
jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')
const { DEFAULT_PLUGIN_BRANCH, LERNA_JSON_PATH, PLUGIN_PREFIX } = require.requireActual('../../constants')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGenerator = require.requireMock('@rispa/generator')
const mockGithubApi = require.requireMock('../../utils/githubApi')

const CreateProjectCommand = require.requireActual('../createProject')

describe('create project', () => {
  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockInquirer.setMockAnswers({})
    mockGithubApi.setMockPlugins([])
    mockFs.setMockFiles([])
  })

  const cwd = '/cwd'
  const projectName = 'project-name'
  const projectPath = path.resolve(cwd, `./${projectName}`)
  const remoteUrl = 'https://git.com/remote-url.git'
  const pluginName = 'rispa-core'
  const pluginRemoteUrl = 'https://git.com/plugin-remote-url.git'

  const runCommand = (args, options) => {
    const command = new CreateProjectCommand(args, { renderer: 'silent' })
    command.init()
    return command.run(Object.assign({
      cwd,
    }, options))
  }

  const crossSpawnOptions = { cwd: projectPath, stdio: 'inherit' }

  const expectSuccessCreateProjectViaYarn = (crossSpawnCalls, runGeneratorActions) => {
    expect(crossSpawnCalls[0]).toEqual(['git', ['init'], crossSpawnOptions])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', 'origin', remoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', `Create project '${projectName}'`], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions])
    expect(crossSpawnCalls[6]).toEqual(['yarn', ['install'], crossSpawnOptions])
    expect(crossSpawnCalls[7]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[8]).toEqual(['git', ['commit', '-m', 'Bootstrap deps and install plugins'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(9)

    expect(runGeneratorActions).toBeCalledWith({ projectName })
  }

  it('should success create project', async () => {
    mockFs.setMockFiles([])

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      cloneUrl: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    mockInquirer.setMockAnswers({
      selectedPlugins: [
        {
          name: pluginName,
          cloneUrl: pluginRemoteUrl,
        },
      ],
    })

    const runGeneratorActions = jest.fn()
    mockGenerator.setMockGenerators({
      project: {
        runActions: runGeneratorActions,
      },
    })

    await expect(runCommand([projectName])).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['init'], crossSpawnOptions])
    expect(crossSpawnCalls[1]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['commit', '-m', `Create project '${projectName}'`], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, DEFAULT_PLUGIN_BRANCH], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['npm', ['install'], crossSpawnOptions])
    expect(crossSpawnCalls[6]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[7]).toEqual(['git', ['commit', '-m', 'Bootstrap deps and install plugins'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(8)

    expect(runGeneratorActions).toBeCalledWith({ projectName })
  })

  it('should success create project via yarn', async () => {
    mockFs.setMockFiles([])

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      cloneUrl: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    mockInquirer.setMockAnswers({
      selectedPlugins: [{
        name: pluginName,
        cloneUrl: pluginRemoteUrl,
      }],
      projectName,
      remoteUrl,
    })

    const runGeneratorActions = jest.fn()
    mockGenerator.setMockGenerators({
      project: {
        runActions: runGeneratorActions,
      },
    })

    await expect(runCommand([], { yarn: true })).resolves.toBeDefined()

    expectSuccessCreateProjectViaYarn(mockCrossSpawn.sync.mock.calls, runGeneratorActions)
  })

  it('should success create project via yarn', async () => {
    mockFs.setMockFiles([])

    mockGithubApi.setMockPlugins([{
      name: pluginName,
      cloneUrl: pluginRemoteUrl,
    }])

    mockGithubApi.setMockPluginNamePackageJson({
      [pluginName]: {
        name: pluginName.replace('rispa-', PLUGIN_PREFIX),
      },
    })

    mockInquirer.setMockAnswers({
      selectedPlugins: [{
        name: pluginName,
        cloneUrl: pluginRemoteUrl,
      }],
      projectName,
      remoteUrl,
    })

    const runGeneratorActions = jest.fn()
    mockGenerator.setMockGenerators({
      project: {
        runActions: runGeneratorActions,
      },
    })

    mockFs.setMockJson({
      [path.resolve(projectPath, LERNA_JSON_PATH)]: {
        npmClient: 'yarn',
      },
    })

    await expect(runCommand([])).resolves.toBeDefined()

    expectSuccessCreateProjectViaYarn(mockCrossSpawn.sync.mock.calls, runGeneratorActions)
  })

  it('should failed create project - project exist', async () => {
    mockFs.setMockFiles([projectPath])

    await expect(runCommand([projectName]))
      .rejects.toHaveProperty(
        'message',
        `The directory '${projectName}' already exist.\nTry using a new project name.`
      )
  })
})
