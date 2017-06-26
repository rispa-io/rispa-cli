jest.resetAllMocks()
jest.resetModules()

const { isPromise } = require.requireActual('../promise')

describe('promise utils', () => {
  it('should determined promise', () => {
    expect(isPromise(Promise.resolve())).toBe(true)
    expect(isPromise(new Promise(jest.fn()))).toBe(true)
    expect(isPromise({ then: () => true })).toBe(true)
  })

  it('should not determined promise', () => {
    expect(isPromise(() => Promise.resolve())).toBe(false)
    expect(isPromise(() => Promise.resolve())).toBe(false)
  })
})
