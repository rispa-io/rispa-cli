const fs = jest.genMockFromModule('fs-extra')

let mockFiles = []
let mockEnsureDirCallback
let mockRemoveCallback = {}

fs.writeFileSync = (path, data) => {
  if (typeof path !== 'string' || typeof data !== 'string') {
    throw new Error()
  }
}

fs.ensureDirSync = () => {
  if (mockEnsureDirCallback) {
    mockEnsureDirCallback()
  }
}

fs.existsSync = filePath => mockFiles.indexOf(filePath) !== -1

fs.removeSync = path => {
  if (mockRemoveCallback[path]) {
    mockRemoveCallback[path]()
  }
}

fs.setMockEnsureDirCallback = cb => { mockEnsureDirCallback = cb }

fs.setMockRemoveCallback = newMockRemoveCallback => { mockRemoveCallback = newMockRemoveCallback }

fs.setMockFiles = newMockFiles => {
  mockFiles = newMockFiles
}

module.exports = fs
