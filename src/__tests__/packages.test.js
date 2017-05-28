jest.resetAllMocks()
jest.mock('cross-spawn')
jest.mock('fs-extra')
jest.mock('glob')
jest.mock('../core')

const {
  scanPackages, findPackagesByPath, findPackagesByPathFromCache, packageInfoByPath, saveCache,
} = require('../packages')

describe('scan packages', () => {
  const basePath = '/sample/path'
  const packagesNames = ['core', 'eslint-config']
  const packagesScanPath = `${basePath}/node_modules/*`
  const packagesPaths = packagesNames.map(packageName => `${basePath}/${packageName}`)

  const packagesInfo = packagesNames.reduce((result, packageName, idx) => {
    const packageInfo = {
      name: packageName,
      path: `${basePath}/${packageName}`,
    }

    if (idx % 2) {
      packageInfo.alias = `@rispa/${packageName}`
      packageInfo.commands = ['start']
      packageInfo.activatorPath = `${basePath}/${packageName}/.rispa/activator.js`
    } else {
      packageInfo.alias = null
      packageInfo.commands = []
      packageInfo.activatorPath = false
    }

    if (packageInfo.alias) {
      result[packageInfo.alias] = packageInfo
    }
    result[packageName] = packageInfo

    return result
  }, {})

  const failedPath = '/failed/path'

  const cache = {
    paths: {
      [packagesScanPath]: packagesNames,
    },
    packages: packagesInfo,
  }

  beforeAll(() => {
    require('glob').setMockPaths({
      [packagesScanPath]: packagesPaths,
      [failedPath]: [`${failedPath}/package`],
    })

    require('fs-extra').setMockFiles([
      `${packagesPaths[1]}/.rispa/activator.js`,
    ])

    require('../core').setMockModules(
      packagesNames.reduce((modules, name, idx) =>
        Object.assign(modules, {
          [`${basePath}/${name}/package.json`]: {
            name,
            scripts: idx % 2 ? { start: '' } : undefined,
            'rispa:plugin': true,
            'rispa:name': idx % 2 ? `@rispa/${name}` : null,
          },
        }),
        {
          [`${basePath}/build/activators.json`]: null,
          [`${basePath}/lerna.json`]: null,
        }
      )
    )
  })

  afterAll(() => {
    require('glob').setMockPaths({})
    require('../core').setMockModules({})
    require('fs-extra').setMockFiles([])
  })

  it('should success save cache', () => {
    expect(saveCache(
      {
        [basePath]: packagesInfo,
      },
      packagesInfo,
      `${basePath}/build/activators.json`
    )).toBeFalsy()
  })

  it('should failed find package info', () => {
    expect(packageInfoByPath('')).toBeNull()
  })

  it('should success find packages from cache', () => {
    expect(findPackagesByPathFromCache(packagesScanPath, cache)).toEqual(packagesInfo)
  })

  it('should failed find packages from cache', () => {
    const emptyCache = {
      paths: {},
      packages: {},
    }
    expect(findPackagesByPathFromCache(packagesScanPath, emptyCache)).toEqual({})
  })

  it('should success find packages', () => {
    expect(findPackagesByPath(packagesScanPath)).toEqual(packagesInfo)
  })

  it('should failed find packages', () => {
    expect(findPackagesByPath(failedPath)).toEqual({})
  })

  it('should success scan packages', () => {
    expect(scanPackages(basePath)).toEqual(packagesInfo)
  })

  it('should success scan packages with default path', () => {
    expect(scanPackages()).toEqual({})
  })
})

describe('scan packages with lerna.json', () => {
  const basePath = '/sample/path'

  beforeAll(() => {
    require('glob').setMockPaths({})

    require('../core').setMockModules({
      [`${basePath}/build/activators.json`]: {
        paths: {
          [`${basePath}/packages/*`]: [],
        },
        packages: {},
      },
      [`${basePath}/lerna.json`]: {
        packages: ['packages/*'],
      },
    })
  })

  afterAll(() => {
    require('glob').setMockPaths({})
    require('../core').setMockModules({})
  })

  it('should success scan packages with lerna.json', () => {
    expect(scanPackages(basePath)).toEqual({})
  })
})
