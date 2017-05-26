let nodePlop = jest.genMockFromModule('node-plop')

nodePlop = () => ({
  getGenerator: () => ({
    runActions: () => Promise.resolve(),
  }),
})

module.exports = nodePlop
