/* eslint-disable import/no-dynamic-require, global-require */

jest.resetAllMocks()
jest.mock('inquirer')
jest.mock('node-plop')
jest.mock('fs-extra')
jest.mock('cross-spawn')
jest.mock('../core')
jest.mock('../githubApi')

const fs = require('fs-extra')

const createProject = require('../createProject')

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

    require('inquirer').setMockAnswers({
      projectName,
      installPluginsNames: pluginsNames,
    })
  })

  afterAll(() => {
    Object.defineProperty(process, 'exit', {
      value: originalExit,
    })

    require('inquirer').setMockAnswers({})
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

    fs.setMockEnsureDirCallback(() => { throw new Error(message) })

    await expect(createProject())
      .rejects.toHaveProperty('message', message)
  })
})
