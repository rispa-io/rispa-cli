jest.mock('fs-extra')

const mockFs = require.requireMock('fs-extra')

const path = require.requireActual('path')
const { checkUseYarnLerna } = require.requireActual('../useYarn')
const { LERNA_JSON_PATH } = require.requireActual('../../constants')

describe('yarn utils', () => {
  describe('check use yarn lerna', () => {
    const projectPath = '/cwd'

    it('should use lerna', () => {
      mockFs.setMockJson({
        [path.resolve(projectPath, LERNA_JSON_PATH)]: { npmClient: 'yarn' },
      })

      expect(checkUseYarnLerna(projectPath)).toBe(true)
    })
  })
})
