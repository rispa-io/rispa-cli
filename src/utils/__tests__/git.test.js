jest.mock('cross-spawn')

const { DEFAULT_PLUGIN_BRANCH } = require.requireActual('../../constants')
const mockCrossSpawn = require.requireMock('cross-spawn')
const {
  getRemotes,
  removeRemote,
  addSubtree,
  push,
  addTag,
  tagInfo,
  pullRepository,
  updateSubtree,
} = require.requireActual('../git')

describe('git', () => {
  const cwd = '/path'
  const spawnOptions = { cwd, stdio: 'inherit' }

  beforeEach(() => {
    mockCrossSpawn.sync.mockClear()
    mockCrossSpawn.setMockOutput()
    mockCrossSpawn.setMockReject(false)
  })

  describe('getRemotes', () => {
    it('should throw error if command failed', () => {
      mockCrossSpawn.setMockReject(true)

      expect(() => getRemotes(cwd)).toThrow('Can\'t get remotes')
    })

    it('should return empty remotes object if no remotes found', () => {
      expect(getRemotes(cwd)).toEqual({})
    })

    it('should return correct remotes list', () => {
      mockCrossSpawn.setMockOutput([null, new Buffer(`
        rispa-core      https://github.com/rispa-io/rispa-core.git (fetch)
        rispa-core      https://github.com/rispa-io/rispa-core.git (push)
        rispa-redux     https://github.com/rispa-io/rispa-redux.git (fetch)
        rispa-redux     https://github.com/rispa-io/rispa-redux.git (push)
      `)])

      expect(getRemotes(cwd)).toEqual({
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

  describe('removeRemote', () => {
    it('should work correctly', () => {
      removeRemote(cwd, 'remoteName')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'rm', 'remoteName'], spawnOptions)
    })
  })

  describe('push', () => {
    it('should work correctly', () => {
      mockCrossSpawn.setMockReject(false)
      push(cwd)

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['push'], spawnOptions)
    })
  })

  describe('addSubtree', () => {
    const path = '/projectPath'
    const remoteName = 'remoteName'
    const prefix = `packages/${remoteName}`
    const remoteUrl = 'remoteUrl'

    it('should throw error if failed add remote', () => {
      mockCrossSpawn.setMockReject(true)

      expect(() => addSubtree(path, prefix, remoteName, remoteUrl)).toThrow('Failed add remote')
    })

    it('should throw error if failed add subtree', () => {
      mockCrossSpawn.sync
        .mockImplementationOnce(() => ({ status: 0 }))
        .mockImplementationOnce(() => ({ status: 1 }))

      expect(() => addSubtree(path, prefix, remoteName, remoteUrl)).toThrow('Failed add subtree')
    })
  })

  describe('addTag', () => {
    it('should work correctly', () => {
      mockCrossSpawn.setMockReject(false)
      addTag(cwd, 'v1.0.0')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['tag', 'v1.0.0'], spawnOptions)
      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['push', '--tags'], spawnOptions)
    })
  })

  describe('tagInfo', () => {
    it('should work correctly', () => {
      const tagDescription = 'v2.4.11-2-aaaaaaaa'
      mockCrossSpawn.setMockReject(false)
      mockCrossSpawn.setMockOutput([null, new Buffer(tagDescription)])

      expect(tagInfo(cwd)).toEqual({
        version: '2.4.11',
        versionParts: {
          major: '2',
          minor: '4',
          patch: '11',
        },
        newCommitsCount: '2',
      })
    })

    it('should return null if version tag not found', () => {
      mockCrossSpawn.setMockOutput([null, new Buffer('')])
      expect(tagInfo(cwd)).toBe(null)
    })
  })

  describe('pull', () => {
    it('should work correctly', () => {
      mockCrossSpawn.setMockReject(false)
      pullRepository(cwd)

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['pull'], spawnOptions)
    })
  })

  describe('updateSubtree', () => {
    it('should work correctly', () => {
      mockCrossSpawn.setMockReject(false)

      updateSubtree(cwd, 'prefix', 'remoteName', 'remoteUrl', 'ref')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'add', 'remoteName', 'remoteUrl'], spawnOptions)
      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['subtree', 'pull', '--prefix=prefix', 'remoteName', 'ref'],
        spawnOptions,
      )
    })

    it('should work correctly with default ref', () => {
      mockCrossSpawn.setMockReject(false)

      updateSubtree(cwd, 'prefix', 'remoteName', 'remoteUrl')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'add', 'remoteName', 'remoteUrl'], spawnOptions)
      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['subtree', 'pull', '--prefix=prefix', 'remoteName', DEFAULT_PLUGIN_BRANCH],
        spawnOptions,
      )
    })
  })
})
