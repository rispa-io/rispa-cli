jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('../../packages')
jest.mock('../../core')

const mockPackages = require('../../packages')

const run = require.requireActual('../runScript')

describe('run script', () => {
  let originalExit
  let originalConsoleLog

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
    originalConsoleLog = console.log

    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })
  })

  afterEach(() => {
    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    Object.defineProperty(console, 'log', {
      value: originalConsoleLog,
    })

    mockPackages.setMockPackages({})
    require('inquirer').setMockAnswers({})
  })

  it('should failed run script - packages not found', async () => {
    mockPackages.setMockPackages({})

    await expect(run(packageName, packageCommand))
      .rejects.toHaveProperty('message', 'Can\'t find packages.')
  })

  it('should success run script in single package', async () => {
    mockPackages.setMockPackages(packages)

    await expect(run(packageName, packageCommand))
      .rejects.toBe(0)
  })

  it('should success run script in all packages', async () => {
    mockPackages.setMockPackages(packages)

    await expect(run('all', packageCommand))
      .rejects.toBe(0)
  })

  it('should success run script in single package with select package & command with not empty command', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockPackages.setMockPackages(packages)
    require('inquirer').setMockAnswers({
      command: 'start',
      packageName,
    })

    const invalidPackageName = 'invalid'

    await expect(run(invalidPackageName, ''))
      .rejects.toBe(0)

    expect(consoleLog).toBeCalledWith(`Can't find package with name: ${invalidPackageName}.`)
  })

  it('should success run script in single package with select package & command', async () => {
    mockPackages.setMockPackages(packages)
    require('inquirer').setMockAnswers({
      command: 'start',
      packageName,
    })

    await expect(run('', ''))
      .rejects.toBe(0)
  })

  it('should success run script in single package with select command', async () => {
    const consoleLog = jest.fn()

    Object.defineProperty(console, 'log', {
      value: consoleLog,
    })

    mockPackages.setMockPackages(packages)
    require('inquirer').setMockAnswers({
      command: 'start',
    })

    await expect(run(packageName, ''))
      .rejects.toBe(0)

    expect(consoleLog).toBeCalledWith(`Can't find command "" in package with name: ${packageName}.`)
  })

  it('should failed run script in all packages - cant find command', async () => {
    mockPackages.setMockPackages(packages)
    const command = 'invalid'

    await expect(run('all', command))
      .rejects.toHaveProperty('message', `Can't find command "${command}" in packages.`)
  })
})
