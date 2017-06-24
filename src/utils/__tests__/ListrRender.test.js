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

  let actionHandler
  let errorHandler

  const listrRender = new ListrRender([{
    subscribe: (handler1, handler2) => {
      actionHandler = handler1
      errorHandler = handler2
    },
    isPending: () => false,
    isSkipped: () => false,
    title,
  }])
  listrRender.render()

  it('should handle default type', () => {
    actionHandler({
      type: 'default',
    })

    expect(console.log.mock.calls.length).toBe(0)
  })

  it('should handle default type', () => {
    actionHandler({
      type: 'title',
    })

    expect(console.log.mock.calls[0][0]).toContain(title)
    expect(console.log.mock.calls.length).toBe(1)
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
