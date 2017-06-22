const PACKAGE_JSON_PATH = './package.json'
const YARN_LOCK_PATH = './yarn.lock'
const LERNA_JSON_PATH = './lerna.json'
const CONFIGURATION_PATH = './rispa.json'
const PLUGINS_CACHE_PATH = './build/plugins.json'
const LOG_TIME_FORMAT = 'HH:mm:ss'
const GITHUB_SEARCH_PLUGINS_QUERY = 'q=user:rispa-io+topic:rispa-plugin'
const PLUGIN_PREFIX = '@rispa/'
const PLUGIN_ALIAS = 'rispa:name'
const PLUGIN_ACTIVATOR_PATH = './.rispa/activator.js'
const PLUGIN_GENERATORS_PATH = './.rispa/generators/index.js'
const PLUGIN_GIT_PREFIX = 'git:'
const DEV_MODE = 'dev'
const ALL_PLUGINS = 'all'

module.exports = {
  PACKAGE_JSON_PATH,
  YARN_LOCK_PATH,
  LERNA_JSON_PATH,
  CONFIGURATION_PATH,
  PLUGINS_CACHE_PATH,
  LOG_TIME_FORMAT,
  GITHUB_SEARCH_PLUGINS_QUERY,
  PLUGIN_PREFIX,
  PLUGIN_ACTIVATOR_PATH,
  PLUGIN_GENERATORS_PATH,
  PLUGIN_ALIAS,
  PLUGIN_GIT_PREFIX,
  DEV_MODE,
  ALL_PLUGINS,
}
