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
    })
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

    expect(consoleLog).toBeCalledWith(`Project "${projectName}" successfully generated!`)
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

    expect(consoleLog).toBeCalledWith(`Project "${projectName}" successfully generated!`)
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

    expect(consoleLog).toBeCalledWith(`Project "${projectName}" successfully generated!`)
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
})
