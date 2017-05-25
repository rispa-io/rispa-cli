const core = jest.genMockFromModule('../core')

let mockModules = {

}

core.setMockModules = newMockModules => { mockModules = newMockModules }

core.requireIfExist = id => {
  const mockModule = mockModules[id]
  if (mockModule) {
    return mockModule
  }

  return null
}

module.exports = core
