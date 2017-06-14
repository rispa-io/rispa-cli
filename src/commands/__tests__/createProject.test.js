jest.resetAllMocks()
jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('inquirer')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../../core', () => require.requireActual('../../__mocks__/core'))
jest.mock('../../githubApi')

const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')
const mockCore = require.requireMock('../../core')
const mockCrossSpawn = require.requireMock('cross-spawn')

const path = require.requireActual('path')

const createProject = require.requireActual('../createProject')

describe('create project', () => {
  let originalExit
  let originalConsoleLog

  const distPath = process.cwd()
  const projectName = 'exampleProject'
  const projectPath = path.resolve(distPath, `./${projectName}`)
  const lernaJsonPath = path.resolve(projectPath, './lerna.json')
  const pluginsNames = ['rispa-core', 'rispa-eslint-config']
  const successMessage = `Project "${projectName}" successfully generated!`
  const crossSpawnOptions = { cwd: projectPath, stdio: 'inherit' }

  beforeAll(() => {
    originalExit = process.exit
    originalConsoleLog = console.log

    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })

    mockInquirer.setMockAnswers({
      projectName,
      installPluginsNames: pluginsNames,
      remoteUrl: '',
    })
  })

  afterEach(() => {
    mockFs.setMockEnsureDirCallback()
    mockCrossSpawn.sync.mockClear()
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })

    mockInquirer.setMockAnswers({})
  })

  it('should success create project with yarn', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'yarn',
      },
    })

    await expect(createProject())
      .rejects.toBe(1)

    expect(consoleLog).toBeCalledWith(successMessage)
  })

  it('should success create project with npm', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'npm',
      },
    })

    await expect(createProject())
      .rejects.toBe(1)

    expect(consoleLog).toBeCalledWith(successMessage)
  })

  it('should success create project with name param', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'yarn',
      },
    })

    await expect(createProject(projectName))
      .rejects.toBe(1)

    expect(consoleLog).toBeCalledWith(successMessage)
  })

  it('should failed create project', async () => {
    const message = 'invalid'

    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'yarn',
      },
    })
    mockFs.setMockEnsureDirCallback(() => { throw new Error(message) })

    await expect(createProject())
      .rejects.toHaveProperty('message', message)
  })

  it('should create project and add initial commit', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'yarn',
      },
    })

    await expect(createProject(projectName, '--mode=dev'))
      .rejects.toBe(1)

    expect(mockCrossSpawn.sync).toBeCalledWith('yarn', ['install'], crossSpawnOptions)
    expect(mockCrossSpawn.sync).toBeCalledWith('yarn', ['bs'], crossSpawnOptions)
    expect(mockCrossSpawn.sync).toBeCalledWith('git', ['init'], crossSpawnOptions)
    expect(mockCrossSpawn.sync).toBeCalledWith('git', ['add', '.'], crossSpawnOptions)
    expect(mockCrossSpawn.sync).toBeCalledWith(
      'git', ['commit', '-m', 'Initial commit'], crossSpawnOptions
    )

    expect(consoleLog).toBeCalledWith(successMessage)
  })

  it('should create project in dev mode', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'yarn',
      },
    })

    await expect(createProject(projectName, '--mode=dev'))
      .rejects.toBe(1)

    expect(consoleLog).toBeCalledWith(successMessage)
  })

  it('should create project with remoteUrl specified', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockInquirer.setMockAnswers({
      projectName,
      installPluginsNames: pluginsNames,
      remoteUrl: '/remote',
    })
    mockCore.setMockModules({
      [lernaJsonPath]: {
        npmClient: 'yarn',
      },
    })

    await expect(createProject(projectName))
      .rejects.toBe(1)

    expect(mockCrossSpawn.sync).toBeCalledWith(
      'git', ['remote', 'add', 'origin', '/remote'], crossSpawnOptions
    )

    expect(consoleLog).toBeCalledWith(successMessage)
  })
})
