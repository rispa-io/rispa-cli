jest.resetAllMocks()
jest.resetModules()

jest.mock('cross-spawn')

const mockCrossSpawn = require.requireMock('cross-spawn')
const { getRemotes } = require.requireActual('../git')

describe('git', () => {
  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
  })

  describe('getRemotes', () => {
    const path = '/projectPath'

    it('should throw error if command failed', () => {
      mockCrossSpawn.setMockReject(true)

      expect(() => getRemotes(path)).toThrow('Can\'t get remotes')
    })

    it('should return empty remotes object if no remotes found', () => {
      expect(getRemotes(path)).toEqual({})
    })

    it('should return correct remotes list', () => {
      mockCrossSpawn.setMockOutput([null, new Buffer(`
        rispa-core      https://github.com/rispa-io/rispa-core.git (fetch)
        rispa-core      https://github.com/rispa-io/rispa-core.git (push)
        rispa-redux     https://github.com/rispa-io/rispa-redux.git (fetch)
        rispa-redux     https://github.com/rispa-io/rispa-redux.git (push)
      `)])

      expect(getRemotes(path)).toEqual({
        'rispa-core': {
          fetch: 'https://github.com/rispa-io/rispa-core.git',
          push: 'https://github.com/rispa-io/rispa-core.git',
        },
        'rispa-redux': {
          fetch: 'https://github.com/rispa-io/rispa-redux.git',
          push: 'https://github.com/rispa-io/rispa-redux.git',
        },
      })
    })
  })
})

