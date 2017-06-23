jest.resetAllMocks()
jest.resetModules()

jest.mock('../../utils/githubApi', () => require.requireActual('../../utils/__mocks__/githubApi'))
jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('cross-spawn')
jest.mock('inquirer')
jest.mock('fs-extra')

const path = require.requireActual('path')

const mockCrossSpawn = require.requireMock('cross-spawn')
const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockGenerator = require.requireMock('@rispa/generator')
const mockGithubApi = require.requireMock('../../utils/githubApi')

const CreateProjectCommand = require.requireActual('../createProject')

describe('create project', () => {
  let originalConsoleLog

  beforeAll(() => {
    originalConsoleLog = console.log

    mockGenerator.setMockGenerators({
      project: true,
    })
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

  const crossSpawnOptions = { cwd: projectPath, stdio: 'inherit' }

  it('should success create project', async () => {
    mockFs.setMockFiles([])

    mockGithubApi.setMockPlugins([
      {
        name: pluginName,
        clone_url: pluginRemoteUrl,
      },
    ])

    mockInquirer.setMockAnswers({
      selectedPlugins: [
        {
          name: pluginName,
          cloneUrl: pluginRemoteUrl,
        },
      ],
    })

    const createProjectCommand = new CreateProjectCommand([projectName])
    createProjectCommand.init()

    await expect(createProjectCommand.run({
      cwd,
    })).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['init'], crossSpawnOptions])
    expect(crossSpawnCalls[1]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['commit', '-m', `Create project '${projectName}'`], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, 'master'], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['npm', ['install'], crossSpawnOptions])
    expect(crossSpawnCalls[6]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[7]).toEqual(['git', ['commit', '-m', 'Bootstrap deps and install plugins'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(8)
  })

  it('should success create project via yarn', async () => {
    mockFs.setMockFiles([])

    mockGithubApi.setMockPlugins([
      {
        name: pluginName,
        clone_url: pluginRemoteUrl,
      },
    ])

    mockInquirer.setMockAnswers({
      selectedPlugins: [
        {
          name: pluginName,
          cloneUrl: pluginRemoteUrl,
        },
      ],
      projectName,
      remoteUrl,
    })

    const createProjectCommand = new CreateProjectCommand([])
    createProjectCommand.init()

    await expect(createProjectCommand.run({
      cwd,
      yarn: true,
    }).catch(e => console.error(e))).resolves.toBeDefined()

    const crossSpawnCalls = mockCrossSpawn.sync.mock.calls
    expect(crossSpawnCalls[0]).toEqual(['git', ['init'], crossSpawnOptions])
    expect(crossSpawnCalls[1]).toEqual(['git', ['remote', 'add', 'origin', remoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[2]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[3]).toEqual(['git', ['commit', '-m', `Create project '${projectName}'`], crossSpawnOptions])
    expect(crossSpawnCalls[4]).toEqual(['git', ['remote', 'add', pluginName, pluginRemoteUrl], crossSpawnOptions])
    expect(crossSpawnCalls[5]).toEqual(['git', ['subtree', 'add', `--prefix=packages/${pluginName}`, pluginName, 'master'], crossSpawnOptions])
    expect(crossSpawnCalls[6]).toEqual(['yarn', ['install'], crossSpawnOptions])
    expect(crossSpawnCalls[7]).toEqual(['git', ['add', '.'], crossSpawnOptions])
    expect(crossSpawnCalls[8]).toEqual(['git', ['commit', '-m', 'Bootstrap deps and install plugins'], crossSpawnOptions])

    expect(crossSpawnCalls.length).toBe(9)
  })

  it('should failed create project - project exist', async () => {
    mockFs.setMockFiles([projectPath])

    const createProjectCommand = new CreateProjectCommand([projectName])
    createProjectCommand.init()

    await expect(createProjectCommand.run({
      cwd,
    })).rejects.toHaveProperty(
      'message',
      `The directory '${projectName}' already exist.\nTry using a new project name.`
    )
  })
})
