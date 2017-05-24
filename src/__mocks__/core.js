const core = jest.genMockFromModule('../core')

let mockModules = {

}

core.setMockModules = newMockModules => { mockModules = newMockModules }

const requireIfExist = core.requireIfExist

core.requireIfExist = id => {
  const mockModule = mockModules[id]
  if (mockModule) {
    return mockModule
  }

  return requireIfExist(id)
}

module.exports = core
