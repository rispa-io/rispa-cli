const githubApi = jest.genMockFromModule('../githubApi')

let mockPlugins = []

githubApi.setMockPlugins = newMockPlugins => { mockPlugins = newMockPlugins }

githubApi.plugins = () => Promise.resolve({
  data: {
    count: mockPlugins.length,
    items: mockPlugins,
  },
})

module.exports = githubApi
