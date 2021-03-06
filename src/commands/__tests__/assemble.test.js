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
  return command.run({
    cwd: '/cwd',
    projectPath: '/cwd',
  })
}

describe('assemble command', () => {
  it('should init successfully', () => {
    const command = new AssembleCommand()
    expect(command.init().length).toBe(5)
  })

  it('should run tasks successfully', async () => {
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.configuration = {
        plugins: [{
          name: 'rispa-core',
        }],
      }
    })
    createRestorePluginTask.mockImplementation(plugin => ({
      title: plugin.name,
      task: restorePluginTask,
    }))

    const result = await runCommand()

    expect(result).toBeDefined()
    expect(readProjectConfigurationTask.task).toBeCalled()
    expect(createRestorePluginTask.mock.calls[0][0]).toEqual({ name: 'rispa-core' })
    expect(cleanCache.task).toBeCalled()
  })

  it('should throw error working tree has modifications', async () => {
    mockGit.getChanges.mockImplementation(() => ('changes'))

    await expect(runCommand())
      .rejects.toHaveProperty(
        'message',
        'Working tree has modifications. Cannot restore plugins'
      )
  })
})
