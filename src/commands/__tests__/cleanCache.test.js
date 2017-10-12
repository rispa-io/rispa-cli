jest.mock('../../tasks/readProjectConfiguration')
jest.mock('../../tasks/cleanCache')

const readProjectConfigurationTask = require.requireMock('../../tasks/readProjectConfiguration')
const cleanCache = require.requireMock('../../tasks/cleanCache')

const CleanCacheCommand = require.requireActual('../cleanCache')

describe('clean cache command', () => {
  const projectPath = '/path'

  it('should init successfully', () => {
    const command = new CleanCacheCommand()
    expect(command.init().length).toBe(2)
  })

  it('should run tasks successfully', async () => {
    readProjectConfigurationTask.task.mockClear()
    readProjectConfigurationTask.task.mockImplementation(ctx => {
      ctx.projectPath = projectPath
    })

    const command = new CleanCacheCommand({
      renderer: 'silent',
    })
    const result = await command.run({
      cwd: '/cwd',
    })

    expect(result).toBeDefined()
    expect(readProjectConfigurationTask.task).toBeCalled()
    expect(cleanCache.task).toBeCalled()
  })
})
