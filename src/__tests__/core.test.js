jest.resetAllMocks()
jest.mock('fs-extra')
jest.mock('cross-spawn')

const fs = require('fs-extra')
const path = require('path')

const {
  requireIfExist, handleError,
  callScript, callScriptList,
  callScriptByYarn, callScriptByNpm,
} = require('../core')

describe('require modules if exist', () => {
  it('should load package.json data', () => {
    expect(requireIfExist('../package.json')).toHaveProperty('name', '@rispa/cli')
  })

  it('should not find module', () => {
    expect(requireIfExist('./notExist.file')).toBeNull()
  })
})

describe('call script', () => {
  const packageInfo = {
    name: 'root',
    path: 'path',
  }

  afterAll(() => {
    fs.setMockFiles([])
  })

  it('should call script is call script by npm', () => {
    fs.setMockFiles([])

    expect(callScript(packageInfo, '--version')).toBe(0)
  })

  it('should call script is call script by yarn', () => {
    fs.setMockFiles([path.resolve(process.cwd(), './yarn.lock')])

    expect(callScript(packageInfo, '--version')).toBe(0)
  })

  it('should success call script', () => {
    expect(callScript(packageInfo, '--version')).toBe(0)
  })

  it('should success call script by yarn', () => {
    expect(callScriptByYarn(packageInfo, '--version')).toBe(0)
  })

  it('should success call script by npm', () => {
    expect(callScriptByNpm(packageInfo, '--version')).toBe(0)
  })

  it('should success call script list', () => {
    expect(callScriptList([packageInfo], '--version')).toBe(0)
  })
})

describe('handle error', () => {
  let originalExit

  beforeAll(() => {
    originalExit = process.exit
    Object.defineProperty(process, 'exit', {
      value: error => { throw new Error(error) },
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })
  })

  it('should handle error', () => {
    expect(() => {
      handleError('error')
    }).toThrow(Error)
  })
})
