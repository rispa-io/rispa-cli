const path = require.requireActual('path')

jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../utils/git')
jest.mock('inquirer')

const readProjectConfiguration = require.requireMock('../../tasks/readProjectConfiguration')
const mockGit = require.requireMock('../../utils/git')
const mockInquirer = require.requireMock('inquirer')

const NumerateCommand = require.requireActual('../numerate')

describe('numerate', () => {
  let originalConsoleLog

  beforeAll(() => {
    originalConsoleLog = console.log
    Object.defineProperty(console, 'log', {
      value: jest.fn(),
    })
  })

  afterAll(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  beforeEach(() => {
    mockGit.tagInfo.mockClear()
    mockGit.addTag.mockClear()
  })

  const cwd = '/cwd'
  const projectPath = '/project'
  const plugins = ['rispa-core']
  const pluginsPath = './plugins'
  const pluginPath = path.resolve(projectPath, pluginsPath, plugins[0])
  const nextVersion = '2.4.12'
  const tagInfo = {
    version: '2.4.11',
    versionParts: {
      major: 2,
      minor: 4,
      patch: 11,
    },
    newCommitsCount: 2,
  }

  const runCommand = () => {
    const command = new NumerateCommand({ renderer: 'silent' })
    command.init()
    return command.run({
      cwd,
      projectPath,
    })
  }

  const mockReadConfigurationTask = mode => {
    readProjectConfiguration.task.mockImplementation(ctx => {
      ctx.configuration = {
        mode,
        plugins,
        pluginsPath,
      }
    })
  }

  it('should numerate project', async () => {
    mockReadConfigurationTask()
    mockGit.tagInfo.mockImplementation(() => tagInfo)
    mockInquirer.setMockAnswers({
      nextVersion,
    })
    mockGit.addTag.mockImplementation(() => true)

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockInquirer.prompt.mock.calls[0][0][0].choices).toEqual([
      {
        name: 'Cancel select',
        value: false,
      },
      {
        name: 'PATCH 2.4.12',
        value: '2.4.12',
      },
      {
        name: 'MINOR 2.5.0',
        value: '2.5.0',
      },
      {
        name: 'MAJOR 3.0.0',
        value: '3.0.0',
      },
    ])
    expect(mockGit.addTag).toBeCalledWith(projectPath, `v${nextVersion}`)
  })

  it('should numerate in dev mode', async () => {
    mockReadConfigurationTask('dev')
    mockGit.tagInfo.mockImplementation(() => tagInfo)
    mockInquirer.setMockAnswers({
      nextVersion,
    })
    mockGit.addTag.mockImplementation(() => true)

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockGit.addTag).toBeCalledWith(projectPath, `v${nextVersion}`)
    expect(mockGit.addTag).toBeCalledWith(pluginPath, `v${nextVersion}`)
  })

  it('should cancel numerate', async () => {
    mockReadConfigurationTask('dev')
    mockGit.tagInfo.mockImplementation(() => tagInfo)
    mockInquirer.setMockAnswers({
      nextVersion: false,
    })
    mockGit.addTag.mockImplementation(() => true)

    await expect(runCommand()).resolves.toBeDefined()
  })

  it('should failed numerate - failed git add tag', async () => {
    mockReadConfigurationTask()
    mockGit.tagInfo.mockImplementation(() => tagInfo)
    mockInquirer.setMockAnswers({
      nextVersion,
    })
    mockGit.addTag.mockImplementation(() => false)

    await expect(runCommand())
      .rejects.toHaveProperty('message', 'Failed git add tag')
  })

  it('should skip tasks if no tag description found', async () => {
    mockReadConfigurationTask('dev')
    mockGit.tagInfo.mockImplementation(() => null)

    await expect(runCommand()).resolves.toBeDefined()
    expect(mockGit.addTag.mock.calls.length).toBe(0)
  })
})
