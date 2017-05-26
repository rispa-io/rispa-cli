const fs = jest.genMockFromModule('fs-extra')

let mockFiles = []
let mockEnsureDirCallback
let mockRemoveCallback

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

fs.removeSync = () => {
  if (mockRemoveCallback) {
    mockRemoveCallback()
  }
}

fs.setMockEnsureDirCallback = cb => { mockEnsureDirCallback = cb }

fs.setMockRemoveCallback = cb => { mockRemoveCallback = cb }

fs.setMockFiles = newMockFiles => {
  mockFiles = newMockFiles
}

module.exports = fs
