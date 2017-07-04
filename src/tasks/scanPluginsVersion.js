const { readPackageJson, compareVersions } = require('../utils/plugin')

const createDefaultVersion = () => ({
  major: 1,
  minor: 0,
  patch: 0,
})

const parseVersion = version => {
  const parts = /(\d+).(\d+).(\d+)/.exec(version)
  const [major, minor, patch] = parts.slice(1)

  return {
    major, minor, patch,
  }
}

const scanPluginsVersionTask = ctx => {
  const plugins = ctx.plugins.map(plugin => Object.assign(plugin, {
    packageInfo: readPackageJson(plugin.path),
  }))

  const maxVersion = plugins
    .map(({ packageInfo }) => parseVersion(packageInfo.version))
    .reduce((currentMaxVersion, version) => (
      compareVersions(version, currentMaxVersion) > 0 ? version : currentMaxVersion
    ), createDefaultVersion())

  ctx.maxVersion = maxVersion
  ctx.plugins = plugins
}

const scanPluginsVersion = {
  title: 'Scan versions',
  task: scanPluginsVersionTask,
}

module.exports = scanPluginsVersion
