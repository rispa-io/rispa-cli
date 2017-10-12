jest.mock('axios')

const mockAxios = require.requireMock('axios')

const {
  GITHUB_SEARCH_PLUGINS_QUERY,
  GITHUB_SEARCH_PLUGINS_EXTENDABLE_QUERY,
  BASE_GITHUB_URL,
  BASE_GITHUB_RAW_URL,
  DEFAULT_PLUGIN_BRANCH,
} = require.requireActual('../../constants')

const githubApi = require.requireActual('../githubApi')

describe('github api', () => {
  const pluginName = 'rispa-core'
  const rawPlugins = [{
    name: pluginName,
    clone_url: 'cloneUrl',
  }]

  it('should get plugins data', async () => {
    mockAxios.setMockData({
      [`${BASE_GITHUB_URL}/search/repositories?${GITHUB_SEARCH_PLUGINS_QUERY}`]: {
        items: [{
          name: pluginName,
          clone_url: 'cloneUrl',
        }],
      },
    })

    await expect(githubApi.plugins()).resolves.toEqual(
      rawPlugins.map(({ name, clone_url }) => ({
        name, clone_url,
      }))
    )
  })

  it('should get plugins extendable data', async () => {
    mockAxios.setMockData({
      [`${BASE_GITHUB_URL}/search/repositories?${GITHUB_SEARCH_PLUGINS_EXTENDABLE_QUERY}`]: {
        items: [{
          name: pluginName,
          clone_url: 'cloneUrl',
        }],
      },
    })

    await expect(githubApi.pluginsExtendable()).resolves.toEqual(
      rawPlugins.map(({ name }) => name)
    )
  })

  it('should get plugins extendable data', async () => {
    const packageJson = {
      name: pluginName,
    }

    mockAxios.setMockData({
      [`${BASE_GITHUB_RAW_URL}/rispa-io/${pluginName}/${DEFAULT_PLUGIN_BRANCH}/package.json`]: packageJson,
    })

    await expect(githubApi.pluginPackageJson(pluginName, DEFAULT_PLUGIN_BRANCH)).resolves.toEqual(packageJson)
  })
})
