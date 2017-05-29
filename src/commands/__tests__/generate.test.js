jest.resetAllMocks()
jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('../../packages')
jest.mock('../../core')

const mockPackages = require.requireMock('../../packages')
const mockGenerator = require.requireMock('@rispa/generator')

const generate = require.requireActual('../generate')

describe('create project', () => {
  let originalExit

  const packageName = '@rispa/core'
  const packages = {
    [packageName]: {
      name: packageName,
      path: '/sample/path',
      generatorsPath: '/.rispa/generators/index.js',
    },
  }
  const generatorName = 'test'

  beforeAll(() => {
    originalExit = process.exit
    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })

    mockPackages.setMockPackages(packages)
    mockGenerator.setMockGenerators({
      [generatorName]: {},
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    mockPackages.setMockPackages({})
    mockGenerator.setMockGenerators({})
  })

  it('should success generate', async () => {
    await expect(generate(packageName, generatorName, 'test=test', 'sample=sample'))
      .rejects.toBe(1)
  })

  it('should failed generate - package not found', async () => {
    const invalidPackageName = 'invalid'
    await expect(generate(invalidPackageName))
      .rejects.toHaveProperty('message', `Can't find plugin with name: ${invalidPackageName}`)
  })

  it('should failed generate - generator not found', async () => {
    const invalidGeneratorName = 'invalid'
    await expect(generate(packageName, invalidGeneratorName))
      .rejects.toHaveProperty('message', `Can't find generator with name: ${invalidGeneratorName}`)
  })
})
