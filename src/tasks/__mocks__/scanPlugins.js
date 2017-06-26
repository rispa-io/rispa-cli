const scanPlugins = jest.genMockFromModule('../scanPlugins.js')

let mockPlugins = {}

scanPlugins.setMockPlugins = val => {
  mockPlugins = val
}

scanPlugins.task = ctx => {
  ctx.plugins = Object.assign({}, mockPlugins)
}

module.exports = scanPlugins
