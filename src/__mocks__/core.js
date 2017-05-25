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

core.handleError = error => { throw new Error(error) }

core.callScript = () => 0

core.callScriptList = () => 0

module.exports = core