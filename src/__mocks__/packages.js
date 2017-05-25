const packages = jest.genMockFromModule('../packages')

let mockPackages = {}

packages.setMockPackages = newMockPackages => { mockPackages = newMockPackages }

packages.scanPackages = () => mockPackages

module.exports = packages
