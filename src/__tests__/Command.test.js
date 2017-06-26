const Command = require.requireActual('../Command')
const Listr = require.requireActual('listr')

describe('Command', () => {
  let originalConsoleLog

  beforeAll(() => {
    originalConsoleLog = console.log
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
  })

  it('should success run tasks', async () => {
    const command = new Command({
      renderer: 'verbose',
    })

    const context = {
      cwd: '/test',
    }

    const task = {
      title: 'Single task',
      before: jest.fn(),
      task: jest.fn(() => Promise.resolve()),
      after: jest.fn(),
    }

    const subtask = {
      title: 'Subtask task',
      task: jest.fn(() => Promise.resolve()),
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

    expect(console.log).toHaveBeenCalledTimes(6)
  })
})
