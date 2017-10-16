const scanPlugins = jest.genMockFromModule('../scanPlugins.js')

let mockPlugins = []

scanPlugins.setMockPlugins = val => {
  mockPlugins = val
}

scanPlugins.task = ctx => {
  ctx.plugins = mockPlugins.concat([])
}

module.exports = scanPlugins
