const Command = require.requireActual('../Command')
const Listr = require.requireActual('listr')

describe('Command', () => {
  it('should success run tasks', async () => {
    const context = {
      cwd: '/test',
    }

    const task = {
      title: 'Single task',
      before: jest.fn(),
      task: jest.fn(),
      after: jest.fn(),
    }

    class ExampleCommand extends Command {
      init() {
        return [
          task,
        ]
      }
    }

    const command = new ExampleCommand({
      renderer: 'silent',
    })

    const subtask = {
      title: 'Subtask task',
      task: jest.fn(),
    }

    const taskWithSubtasks = {
      title: 'Task with subtasks',
      task: jest.fn(() => new Listr([subtask], { exitOnError: false })),
    }

    command.add(task)
    command.add([taskWithSubtasks])

    await expect(command.run(context)).resolves.toBe(context)

    expect(task.before.mock.calls[0][0]).toBe(context)
    expect(task.task.mock.calls[0][0]).toBe(context)
    expect(task.after.mock.calls[0][0]).toBe(context)
    expect(subtask.task.mock.calls[0][0]).toBe(context)
    expect(taskWithSubtasks.task.mock.calls[0][0]).toBe(context)
  })

  it('should failed run without override init method', async () => {
    const command = new Command({
      renderer: 'silent',
    })

    await expect(command.run({})).rejects.toBeInstanceOf(Error)
  })
})
