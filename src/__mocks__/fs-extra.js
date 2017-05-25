const fs = jest.genMockFromModule('fs-extra')

let mockFiles = []
let mockEnsureDirCallback

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

fs.setMockEnsureDirCallback = cb => { mockEnsureDirCallback = cb }

fs.existsSync = filePath => mockFiles.indexOf(filePath) !== -1

fs.setMockFiles = newMockFiles => {
  mockFiles = newMockFiles
}

module.exports = fs
