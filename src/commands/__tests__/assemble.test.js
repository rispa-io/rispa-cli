jest.mock('fs-extra')
jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/restorePlugin')
jest.mock('../../tasks/cleanCache')
jest.mock('../../utils/git')

const readProjectConfigurationTask = require.requireMock('../../tasks/readProjectConfiguration')
const createRestorePluginTask = require.requireMock('../../tasks/restorePlugin')
const cleanCache = require.requireMock('../../tasks/cleanCache')
const mockGit = require.requireMock('../../utils/git')

const AssembleCommand = require.requireActual('../assemble')

const restorePluginTask = jest.fn()

const runCommand = () => {
  const command = new AssembleCommand({
    renderer: 'silent',
  })
  command.init()
  return command.run({
    cwd: '/cwd',
    projectPath: '/cwd',
  })
}

describe('assemble command', () => {
  it('should init successfully', () => {
    const command = new AssembleCommand()
    command.init()
    expect(command.tasks.length).toBe(4)
  })

  it('should run tasks successfully', async () => {
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.configuration = {
        plugins: ['rispa-core'],
      }
    })
    createRestorePluginTask.mockImplementation(name => ({
      title: name,
      task: restorePluginTask,
    }))

    const result = await runCommand()

    expect(result).toBeDefined()
    expect(readProjectConfigurationTask.task).toBeCalled()
    expect(createRestorePluginTask.mock.calls[0][0]).toBe('rispa-core')
    expect(cleanCache.task).toBeCalled()
  })

  it('should throw error working tree has modifications', async () => {
    mockGit.getChanges.mockImplementation(() => ('changes'))

    const command = new AssembleCommand({
      renderer: 'silent',
    })
    command.init()

    await expect(runCommand())
      .rejects.toHaveProperty(
        'message',
        'Working tree has modifications. Cannot restore plugins'
      )
  })
})
