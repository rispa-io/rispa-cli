jest.resetAllMocks()
jest.mock('cross-spawn')
jest.mock('fs-extra')
jest.mock('glob')
jest.mock('../core')

const mockGlob = require.requireMock('glob')
const mockCore = require.requireMock('../core')
const mockFs = require.requireMock('fs-extra')

const {
  scanPackages, findPackagesByPath, findPackagesByPathFromCache, packageInfoByPath, saveCache,
} = require.requireActual('../packages')

describe('scan packages', () => {
  const basePath = '/sample/path'
  const packagesNames = ['@rispa/core', '@rispa/eslint-config']
  const packagesScanPath = `${basePath}/node_modules/*`
  const packagesPaths = packagesNames.map(packageName => `${basePath}/${packageName}`)
  const packagesInfo = packagesNames.reduce((result, packageName, idx) => {
    const packageInfo = {
      name: packageName,
      path: `${basePath}/${packageName}`,
    }

    if (idx % 2) {
      packageInfo.alias = packageName.replace('@rispa/', '')
      packageInfo.commands = ['start']
      packageInfo.activatorPath = `${basePath}/${packageName}/.rispa/activator.js`
      packageInfo.generatorsPath = `${basePath}/${packageName}/.rispa/generators/index.js`
    } else {
      packageInfo.alias = undefined
      packageInfo.commands = []
      packageInfo.activatorPath = false
      packageInfo.generatorsPath = false
    }

    if (packageInfo.alias) {
      result[packageInfo.alias] = packageInfo
    }
    result[packageInfo.name] = packageInfo

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
    mockGlob.setMockPaths({
      [packagesScanPath]: packagesPaths,
      [failedPath]: [`${failedPath}/package`],
    })

    mockFs.setMockFiles([
      `${packagesPaths[1]}/.rispa/activator.js`,
      `${packagesPaths[1]}/.rispa/generators/index.js`,
    ])

    mockCore.setMockModules(
      packagesNames.reduce((modules, name, idx) =>
        Object.assign(modules, {
          [`${basePath}/${name}/package.json`]: {
            name,
            scripts: idx % 2 ? { start: '' } : undefined,
            'rispa:name': idx % 2 ? name.replace('@rispa/', '') : undefined,
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
    mockGlob.setMockPaths({})
    mockCore.setMockModules({})
    mockFs.setMockFiles([])
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
    mockGlob.setMockPaths({})

    mockCore.setMockModules({
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
    mockGlob.setMockPaths({})
    mockCore.setMockModules({})
  })

  it('should success scan packages with lerna.json', () => {
    expect(scanPackages(basePath)).toEqual({})
  })
})
