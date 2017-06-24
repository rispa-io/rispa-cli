jest.resetAllMocks()
jest.resetModules()

jest.mock('axios')

const mockAxios = require.requireMock('axios')

const { GITHUB_SEARCH_PLUGINS_QUERY } = require.requireActual('../../constants')

const githubApi = require.requireActual('../githubApi')

describe('github api', () => {
  it('should get plugins data', async () => {
    const pluginsData = Object.create(null)

    mockAxios.setMockData({
      [`/search/repositories?${GITHUB_SEARCH_PLUGINS_QUERY}`]: pluginsData,
    })

    await expect(githubApi.plugins()).resolves.toEqual({ data: pluginsData })
  })
})
