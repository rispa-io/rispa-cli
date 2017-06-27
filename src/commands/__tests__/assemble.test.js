jest.mock('fs-extra')
jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/restorePlugin')
jest.mock('../../utils/git')

const readProjectConfigurationTask = require.requireMock('../../tasks/readProjectConfiguration')
const createRestorePluginTask = require.requireMock('../../tasks/restorePlugin')
const mockGit = require.requireMock('../../utils/git')

const AssembleCommand = require.requireActual('../assemble')

class ListrEmptyRender {
  constructor() {
    this.render = () => {}
    this.end = () => {}
  }
}

describe('assemble command', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.resetModules()
  })

  describe('init', () => {
    it('should add tasks', () => {
      const command = new AssembleCommand()
      command.init()

      expect(command.tasks.length).toBe(3)
    })
  })

  describe('run', () => {
    const cwd = '/cwd'
    const restorePluginTask = jest.fn()

    it('should run tasks', async () => {
      readProjectConfigurationTask.task.mockImplementation(ctx => {
        ctx.configuration = {
          plugins: ['rispa-core'],
        }
      })
      createRestorePluginTask.mockImplementation(name => ({
        title: name,
        task: restorePluginTask,
      }))

      const command = new AssembleCommand({
        renderer: ListrEmptyRender,
      })
      command.init()
      const result = await command.run({
        cwd,
        projectPath: cwd,
      })

      expect(result).toBeDefined()
      expect(readProjectConfigurationTask.task).toBeCalled()
      expect(createRestorePluginTask.mock.calls[0][0]).toBe('rispa-core')
    })

    it('should throw error working tree has modifications', async () => {
      mockGit.getChanges.mockImplementation(() => ('changes'))

      const command = new AssembleCommand({
        renderer: ListrEmptyRender,
      })
      command.init()

      await expect(command.run({
        cwd,
        projectPath: cwd,
      })).rejects.toHaveProperty(
        'message',
        'Working tree has modifications. Cannot restore plugins'
      )
    })
  })
})
