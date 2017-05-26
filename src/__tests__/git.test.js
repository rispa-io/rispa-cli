/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('cross-spawn')

const { cloneRepository, pullRepository, resetRepository } = require('../git')

describe('working with git', () => {
  it('should success git clone repository', () => {
    expect(cloneRepository('someUrl', 'anyPath')).toBe(0)
  })

  it('should success git pull repository', () => {
    expect(pullRepository('anyPath')).toBe(0)
  })

  it('should success git reset repository to stable', () => {
    expect(resetRepository('anyPath')).toBe(0)
  })
})
