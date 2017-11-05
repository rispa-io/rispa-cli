const generator = jest.genMockFromModule('@rispa/generator')

let mockGenerators = {}

const defaultGenerator = {
  runActions: () => Promise.resolve(),
  runPrompts: () => Promise.resolve(),
}

function mockGenerator() {
  return {
    getGenerator: name => name in mockGenerators ? mockGenerators[name] : defaultGenerator,
    containsGenerator: name => name in mockGenerators,
    getGeneratorList: () => Object
      .entries(mockGenerators)
      .map(([name, value]) =>
        Object.assign({}, value, {
          name,
        })
      ),
    setPlopfilePath: jest.fn(),
  }
}

mockGenerator.setMockGenerators = newGenerators => {
  mockGenerators = Object.assign({}, newGenerators)
}

module.exports = Object.assign(mockGenerator, generator)
