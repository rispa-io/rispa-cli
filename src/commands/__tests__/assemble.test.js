jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/restorePlugin')
const readProjectConfigurationTask = require.requireMock('../../tasks/readProjectConfiguration')
const createRestorePluginTask = require.requireMock('../../tasks/restorePlugin')

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

      expect(command.tasks.length).toBe(2)
      expect(command.tasks[0].title).toBe(readProjectConfigurationTask.title)
      expect(command.tasks[1].title).toBe('Restore plugins')
    })
  })

  describe('run', () => {
    const cwd = '/cwd'
    const restorePluginTask = jest.fn()

    it('should run tasks', done => {
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
      command.run({
        cwd,
        projectPath: cwd,
      }).then(result => {
        expect(result).toBeDefined()
        expect(readProjectConfigurationTask.task).toBeCalled()
        expect(createRestorePluginTask.mock.calls[0][0]).toBe('rispa-core')

        done()
      })
    })
  })
})
