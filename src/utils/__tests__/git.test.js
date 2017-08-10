jest.mock('cross-spawn')

const {
  DEFAULT_PLUGIN_BRANCH,
  DEFAULT_PLUGIN_DEV_BRANCH,
} = require.requireActual('../../constants')
const mockCrossSpawn = require.requireMock('cross-spawn')
const {
  getChanges,
  getRemotes,
  removeRemote,
  addSubtree,
  push,
  addTag,
  tagInfo,
  pullRepository,
  updateSubtree,
  init,
  commit,
  cloneRepository,
  checkout,
  merge,
  clean,
  pushTags,
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
      push(cwd)

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['push'], spawnOptions)
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => push(cwd)).toThrow('Failed git push')
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

    it('should work correctly', () => {
      addSubtree(cwd, 'prefix', 'remoteName', 'remoteUrl', 'ref')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'add', 'remoteName', 'remoteUrl'], spawnOptions)
      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['subtree', 'add', '--prefix=prefix', 'remoteName', 'ref'],
        spawnOptions
      )
    })
  })

  describe('addTag', () => {
    it('should work correctly', () => {
      addTag(cwd, 'v1.0.0')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['tag', 'v1.0.0'], spawnOptions)
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => addTag(cwd, 'v1.0.0')).toThrow('Failed git add tag')
    })
  })

  describe('pushTags', () => {
    it('should work correctly', () => {
      pushTags(cwd)

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['push', '--tags'], spawnOptions)
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => pushTags(cwd)).toThrow('Failed git push tags')
    })
  })

  describe('tagInfo', () => {
    it('should work correctly', () => {
      const tagDescription = 'v2.4.11-2-aaaaaaaa'
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
      pullRepository(cwd)

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['pull'], spawnOptions)
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => pullRepository(cwd)).toThrow('Failed git pull')
    })
  })

  describe('updateSubtree', () => {
    it('should work correctly', () => {
      updateSubtree(cwd, 'prefix', 'remoteName', 'remoteUrl', 'ref')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'add', 'remoteName', 'remoteUrl'], spawnOptions)
      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['subtree', 'pull', '--prefix=prefix', 'remoteName', 'ref'],
        spawnOptions
      )
    })

    it('should work correctly with default ref', () => {
      updateSubtree(cwd, 'prefix', 'remoteName', 'remoteUrl')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'add', 'remoteName', 'remoteUrl'], spawnOptions)
      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['subtree', 'pull', '--prefix=prefix', 'remoteName', DEFAULT_PLUGIN_BRANCH],
        spawnOptions
      )
    })
  })

  describe('init', () => {
    it('should work correctly', () => {
      init(cwd)

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['init'], spawnOptions)
    })

    it('should add remote if success', () => {
      init(cwd, 'remoteUrl')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['init'], spawnOptions)
      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['remote', 'add', 'origin', 'remoteUrl'], spawnOptions)
    })

    it('should not add remote if failed', () => {
      mockCrossSpawn.setMockReject(true)

      init(cwd, 'remoteUrl')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['init'], spawnOptions)
      expect(mockCrossSpawn.sync)
        .not.toBeCalledWith('git', ['remote', 'add', 'origin', 'remoteUrl'], spawnOptions)
    })
  })

  describe('commit', () => {
    it('should work correctly', () => {
      commit(cwd, 'message')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['add', '.'], spawnOptions)
      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['commit', '-m', 'message'], spawnOptions)
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => commit(cwd, 'message')).toThrow('Failed git commit')
    })
  })

  describe('getChanges', () => {
    it('should work correctly', () => {
      mockCrossSpawn.setMockOutput([null, new Buffer('changes')])

      const result = getChanges(cwd)

      expect(result).toBe('changes')
      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['status', '--porcelain'], { cwd, stdio: 'pipe' })
    })
  })

  describe('cloneRepository', () => {
    it('should work correctly', () => {
      cloneRepository(cwd, 'cloneUrl', { ref: 'stable' })

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['clone', 'cloneUrl', '--branch', 'stable'], spawnOptions)
    })

    it('should work correctly with default branch', () => {
      cloneRepository(cwd, 'cloneUrl')

      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['clone', 'cloneUrl', '--branch', DEFAULT_PLUGIN_DEV_BRANCH],
        spawnOptions
      )
    })

    it('should work correctly with depth', () => {
      cloneRepository(cwd, 'cloneUrl', { depth: 1 })

      expect(mockCrossSpawn.sync).toBeCalledWith(
        'git',
        ['clone', 'cloneUrl', '--branch', DEFAULT_PLUGIN_DEV_BRANCH, '--depth', 1],
        spawnOptions
      )
    })

    it('should throw error', () => {
      mockCrossSpawn.setMockReject(true)
      expect(() => cloneRepository(cwd, 'cloneUrl'))
        .toThrow('Can\'t clone repository')
    })
  })

  describe('checkout', () => {
    it('should work correctly', () => {
      checkout(cwd, 'master')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['checkout', 'master'], { cwd, stdio: 'inherit' })
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => checkout(cwd, 'master')).toThrow('Failed git checkout')
    })
  })

  describe('merge', () => {
    it('should work correctly', () => {
      merge(cwd, 'master')

      expect(mockCrossSpawn.sync)
        .toBeCalledWith('git', ['merge', 'master'], { cwd, stdio: 'inherit' })
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => merge(cwd, 'master')).toThrow('Failed git merge')
    })
  })

  describe('clean', () => {
    it('should work correctly', () => {
      clean(cwd)

      expect(mockCrossSpawn.sync.mock.calls[0]).toEqual(['git', ['clean', '-df'], { cwd, stdio: 'inherit' }])
    })

    it('should throw error', () => {
      mockCrossSpawn.sync.mockImplementationOnce(() => ({ status: 1 }))

      expect(() => clean(cwd)).toThrow('Failed git clean')
    })
  })
})
