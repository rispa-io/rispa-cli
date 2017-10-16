const path = require.requireActual('path')

jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../utils/git')
jest.mock('inquirer')

const readProjectConfiguration = require.requireMock('../../tasks/readProjectConfiguration')
const mockGit = require.requireMock('../../utils/git')
const mockInquirer = require.requireMock('inquirer')

const CommitCommand = require.requireActual('../commit')

describe('commit', () => {
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
    mockGit.commit.mockClear()
    mockGit.push.mockClear()
  })

  const cwd = '/cwd'
  const projectPath = '/project'
  const changes = 'M test.js'
  const plugins = ['rispa-core']
  const pluginsPath = './plugins'
  const commitMessage = 'Test commit message'

  const runCommand = () => {
    const command = new CommitCommand({ renderer: 'silent' })
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

  it('should run tasks successfully', async () => {
    mockReadConfigurationTask()
    mockGit.getChanges.mockImplementation(() => changes)
    mockInquirer.setMockAnswers({
      commitMessage,
    })
    mockGit.commit.mockImplementation(() => true)
    mockGit.push.mockImplementation(() => true)

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockGit.commit).toBeCalledWith(projectPath, commitMessage)
    expect(mockGit.push).toBeCalledWith(projectPath)
  })

  it('should run tasks successfully in dev mode', async () => {
    mockReadConfigurationTask('dev')
    mockGit.getChanges.mockImplementation(() => changes)
    mockInquirer.setMockAnswers({
      commitMessage,
    })
    mockGit.commit.mockImplementation(() => true)
    mockGit.push.mockImplementation(() => true)

    await expect(runCommand()).resolves.toBeDefined()

    const pluginPath = path.resolve(projectPath, pluginsPath, 'rispa-core')

    expect(mockGit.commit).toBeCalledWith(pluginPath, commitMessage)
    expect(mockGit.push).toBeCalledWith(pluginPath)
    expect(mockGit.commit).toBeCalledWith(projectPath, commitMessage)
    expect(mockGit.push).toBeCalledWith(projectPath)
  })

  it('should skip tasks if no changes', async () => {
    mockReadConfigurationTask('dev')
    mockGit.getChanges.mockImplementation(() => '')

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockGit.commit.mock.calls.length).toBe(0)
    expect(mockGit.push.mock.calls.length).toBe(0)
  })

  it('should throw error if commit failed', async () => {
    mockReadConfigurationTask()
    mockGit.getChanges.mockImplementation(() => changes)
    mockInquirer.setMockAnswers({
      commitMessage,
    })
    mockGit.commit.mockImplementation(() => {
      throw new Error('Failed git commit')
    })

    await expect(runCommand())
      .rejects.toHaveProperty('message', 'Failed git commit')
  })

  it('should throw error if push failed', async () => {
    mockReadConfigurationTask()
    mockGit.getChanges.mockImplementation(() => changes)
    mockInquirer.setMockAnswers({
      commitMessage,
    })
    mockGit.commit.mockImplementation(() => true)
    mockGit.push.mockImplementation(() => {
      throw new Error('Failed git push')
    })

    await expect(runCommand())
      .rejects.toHaveProperty('message', 'Failed git push')
  })

  it('should not commit if commit message is empty', async () => {
    mockReadConfigurationTask()
    mockGit.getChanges.mockImplementation(() => changes)
    mockInquirer.setMockAnswers({
      commitMessage: '',
    })

    await expect(runCommand()).resolves.toBeDefined()

    expect(mockGit.commit.mock.calls.length).toBe(0)
    expect(mockGit.push.mock.calls.length).toBe(0)
  })
})
