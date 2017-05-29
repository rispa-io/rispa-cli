jest.resetAllMocks()
jest.mock('@rispa/generator', () => require.requireActual('../../__mocks__/generator'))
jest.mock('inquirer')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../../core')
jest.mock('../../githubApi')

const mockInquirer = require.requireMock('inquirer')
const mockFs = require.requireMock('fs-extra')

const createProject = require.requireActual('../createProject')

describe('create project', () => {
  let originalExit

  const projectName = 'exampleProject'
  const pluginsNames = ['rispa-core', 'rispa-eslint-config']

  beforeAll(() => {
    originalExit = process.exit
    Object.defineProperty(process, 'exit', {
      value: code => {
        throw code
      },
    })

    mockInquirer.setMockAnswers({
      projectName,
      installPluginsNames: pluginsNames,
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    mockInquirer.setMockAnswers({})
  })

  it('should success create project', async () => {
    await expect(createProject())
      .rejects.toBe(1)
  })

  it('should success create project with name param', async () => {
    await expect(createProject(projectName))
      .rejects.toBe(1)
  })

  it('should failed create project', async () => {
    const message = 'invalid'

    mockFs.setMockEnsureDirCallback(() => { throw new Error(message) })

    await expect(createProject())
      .rejects.toHaveProperty('message', message)
  })
})
