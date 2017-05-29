jest.resetAllMocks()
jest.mock('axios')

const mockAxios = require.requireMock('axios')

const githubApi = require.requireActual('../githubApi')

describe('github api', () => {
  it('should success fetch plugins', async () => {
    const data = {
      items: [
        {
          name: 'rispa-core',
          clone_url: 'ulr',
        },
      ],
    }
    mockAxios.setMockData({
      '/search/repositories?q=user:rispa-io+topic:rispa-plugin': data,
    })

    const response = await githubApi.plugins()

    expect(response.data).toEqual(data)
  })
})
