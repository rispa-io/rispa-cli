const fs = jest.genMockFromModule('fs')

fs.writeFileSync = () => { }

module.exports = fs
