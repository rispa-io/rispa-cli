const core = jest.genMockFromModule('../core')

let mockModules = {
}

core.setMockModules = newMockModules => { mockModules = newMockModules }

core.requireIfExist = id => {
  const mockModule = mockModules[id]
  if (mockModule) {
    if (typeof mockModule === 'object') {
      return Object.assign({}, mockModule)
    }
    return mockModule
  }

  return null
}

core.handleError = error => {
  throw new Error(error instanceof Error ? error.message : error)
}

core.callScript = () => 0

core.callScriptList = () => 0

module.exports = core
