const generator = jest.genMockFromModule('@rispa/generator')

let mockGenerators = {}

function mockGenerator() {
  return {
    getGenerator: () => ({
      runActions: () => Promise.resolve(),
    }),
    containsGenerator: name => name in mockGenerators,
  }
}

mockGenerator.setMockGenerators = newGenerators => { mockGenerators = Object.assign({}, newGenerators) }

module.exports = Object.assign(mockGenerator, generator)
