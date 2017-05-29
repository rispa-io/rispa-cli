const packages = jest.genMockFromModule('../packages')

let mockPackages = {}

packages.setMockPackages = newMockPackages => { mockPackages = Object.assign({}, newMockPackages) }

packages.scanPackages = () => mockPackages

module.exports = packages
