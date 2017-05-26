/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('../packages')
jest.mock('../core')

const run = require('../runScript')

describe('run script', () => {
  let originalExit

  const basePath = '/sample/path'
  const packageName = 'core'
  const packageCommand = 'start'
  const packages = {
    [packageName]: {
      name: packageName,
      path: `${basePath}/${packageName}`,
      alias: null,
      commands: [packageCommand],
      activatorPath: false,
    },
  }

  beforeAll(() => {
    originalExit = process.exit
    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    require('../packages').setMockPackages({})
    require('inquirer').setMockAnswers({})
  })

  it('should failed run script - packages not found', async () => {
    require('../packages').setMockPackages({})

    await expect(run(packageName, packageCommand))
      .rejects.toHaveProperty('message', 'Can\'t find packages.')
  })

  it('should success run script in single package', async () => {
    require('../packages').setMockPackages(packages)

    await expect(run(packageName, packageCommand))
      .rejects.toBe(0)
  })

  it('should success run script in all packages', async () => {
    require('../packages').setMockPackages(packages)

    await expect(run('all', packageCommand))
      .rejects.toBe(0)
  })

  it('should success run script in single package with select package & command with not empty command', async () => {
    require('../packages').setMockPackages(packages)
    require('inquirer').setMockAnswers({
      command: 'start',
      packageName,
    })

    await expect(run('invalid', ''))
      .rejects.toBe(0)
  })

  it('should success run script in single package with select package & command', async () => {
    require('../packages').setMockPackages(packages)
    require('inquirer').setMockAnswers({
      command: 'start',
      packageName,
    })

    await expect(run('', ''))
      .rejects.toBe(0)
  })

  it('should success run script in single package with select command', async () => {
    require('../packages').setMockPackages(packages)
    require('inquirer').setMockAnswers({
      command: 'start',
    })

    await expect(run(packageName, ''))
      .rejects.toBe(0)
  })

  it('should failed run script in all packages - cant find command', async () => {
    require('../packages').setMockPackages(packages)
    const command = 'invalid'

    await expect(run('all', command))
      .rejects.toHaveProperty('message', `Can't find command "${command}" in packages.`)
  })
})
