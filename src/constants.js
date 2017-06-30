const path = require('path')

const CWD = process.cwd()
const LOCAL_VERSION_PATH = path.resolve(CWD, './node_modules/.bin/ris')

const PACKAGE_JSON_PATH = './package.json'
const YARN_LOCK_PATH = './yarn.lock'
const LERNA_JSON_PATH = './lerna.json'
const CONFIGURATION_PATH = './rispa.json'
const PLUGINS_CACHE_PATH = './build/plugins.json'
const LOG_TIME_FORMAT = 'HH:mm:ss'
const BASE_GITHUB_URL = 'https://api.github.com'
const BASE_GITHUB_RAW_URL = 'https://raw.githubusercontent.com'
const GITHUB_SEARCH_PLUGINS_QUERY = 'q=org:rispa-io+topic:rispa-plugin'
const GITHUB_SEARCH_PLUGINS_EXTENDABLE_QUERY = 'q=org:rispa-io+topic:extendable'
const PLUGIN_PREFIX = '@rispa/'
const PLUGIN_ALIAS = 'rispa:name'
const PLUGIN_ACTIVATOR_PATH = './.rispa/activator.js'
const PLUGIN_GENERATORS_PATH = './.rispa/generators/index.js'
const NODE_MODULES_PLUGINS_PATH = `./node_modules/${PLUGIN_PREFIX}*`
const PLUGIN_GIT_PREFIX = 'git:'
const DEFAULT_PLUGIN_DEV_BRANCH = 'master'
const DEFAULT_PLUGIN_BRANCH = 'stable'
const DEV_MODE = 'dev'
const ALL_PLUGINS = 'all'

module.exports = {
  CWD,
  LOCAL_VERSION_PATH,

  PACKAGE_JSON_PATH,
  YARN_LOCK_PATH,
  LERNA_JSON_PATH,
  CONFIGURATION_PATH,
  PLUGINS_CACHE_PATH,
  LOG_TIME_FORMAT,
  BASE_GITHUB_URL,
  BASE_GITHUB_RAW_URL,
  GITHUB_SEARCH_PLUGINS_QUERY,
  GITHUB_SEARCH_PLUGINS_EXTENDABLE_QUERY,
  PLUGIN_PREFIX,
  PLUGIN_ACTIVATOR_PATH,
  PLUGIN_GENERATORS_PATH,
  NODE_MODULES_PLUGINS_PATH,
  PLUGIN_ALIAS,
  PLUGIN_GIT_PREFIX,
  DEV_MODE,
  ALL_PLUGINS,
  DEFAULT_PLUGIN_BRANCH,
  DEFAULT_PLUGIN_DEV_BRANCH,
}
