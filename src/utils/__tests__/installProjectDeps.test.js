jest.mock('cross-spawn')

const mockCrossSpawn = require.requireMock('cross-spawn')

const { installProjectDepsYarn, installProjectDepsNpm } = require.requireActual('../installProjectDeps')

describe('install project deps', () => {
  const path = '/path'

  it('should failed install via npm', () => {
    mockCrossSpawn.setMockReject(true)

    expect(() => installProjectDepsNpm(path)).toThrow('Failed install project deps via npm')
  })

  it('should failed install via yarn', () => {
    mockCrossSpawn.setMockReject(true)

    expect(() => installProjectDepsYarn(path)).toThrow('Failed install project deps via yarn')
  })
})
