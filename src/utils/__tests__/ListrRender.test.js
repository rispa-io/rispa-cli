jest.resetAllMocks()
jest.resetModules()

jest.mock('cli-cursor', () => ({ show: jest.fn(), hide: jest.fn() }))

const ListrRender = require.requireActual('../ListrRender')

describe('Listr custom render', () => {
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

  const title = 'title-$#@#@#!#!@#'
  const subtaskSubscribe = jest.fn()
  const isPending = jest.fn(() => false)
  const isSkipped = jest.fn(() => false)

  let actionHandler
  let errorHandler

  const task = {
    subscribe: (handler1, handler2) => {
      actionHandler = handler1
      errorHandler = handler2
    },
    isPending,
    isSkipped,
    title,
    state: 'undefined',
    subtasks: [{
      subscribe: subtaskSubscribe,
    }],
  }

  const listrRender = new ListrRender([task])
  listrRender.render()
  listrRender.end()

  it('should handle default type', () => {
    actionHandler({
      type: 'default',
    })

    expect(console.log.mock.calls.length).toBe(0)
  })

  it('should handle title type', () => {
    actionHandler({
      type: 'title',
    })

    expect(console.log.mock.calls[0][0]).toContain(title)
    expect(console.log.mock.calls.length).toBe(1)
  })

  it('should handle state event', () => {
    actionHandler({
      type: 'state',
    })
    expect(console.log.mock.calls[0][0]).toContain('undefined')

    task.state = 'completed'
    actionHandler({
      type: 'state',
    })
    expect(console.log.mock.calls[1][0]).toContain('completed')

    task.state = 'failed'
    actionHandler({
      type: 'state',
    })
    expect(console.log.mock.calls[2][0]).toContain('failed')

    isPending.mockImplementation(() => true)
    actionHandler({
      type: 'state',
    })
    expect(console.log.mock.calls[3][0]).toContain('started')

    isSkipped.mockImplementation(() => true)
    task.output = 'output'
    actionHandler({
      type: 'state',
    })
    expect(console.log.mock.calls[4][0]).toContain('started')
    expect(console.log.mock.calls[5][0]).toContain('output')
  })

  it('should handle data event', () => {
    actionHandler({
      type: 'data',
      data: 'data',
    })
    expect(console.log.mock.calls[0][0]).toContain('data')
  })

  it('should handle subtasks event', () => {
    actionHandler({
      type: 'SUBTASKS',
    })
    expect(subtaskSubscribe).toBeCalled()
  })

  it('should handle error', () => {
    const errorMessage = 'error'
    errorHandler(errorMessage)

    expect(console.log.mock.calls[0][0]).toContain(errorMessage)

    expect(console.log.mock.calls.length).toBe(1)
  })

  it('should get nonTTY param', () => {
    expect(ListrRender.nonTTY).toBe(true)
  })
})
