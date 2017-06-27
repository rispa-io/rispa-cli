const axios = require('axios')
const {
  GITHUB_SEARCH_PLUGINS_QUERY, GITHUB_SEARCH_PLUGINS_EXTENDABLE_QUERY, BASE_GITHUB_URL, BASE_GITHUB_RAW_URL,
} = require('../constants')

const api = axios.create({
  timeout: 10000,
})

module.exports.plugins = () => (
  api.get(`${BASE_GITHUB_URL}/search/repositories?${GITHUB_SEARCH_PLUGINS_QUERY}`)
    .then(({ data: { items: plugins } }) => plugins.map(({ name, clone_url: cloneUrl }) => ({ name, cloneUrl })))
)

module.exports.pluginsExtendable = () => (
  api.get(`${BASE_GITHUB_URL}/search/repositories?${GITHUB_SEARCH_PLUGINS_EXTENDABLE_QUERY}`)
    .then(({ data: { items: plugins } }) => plugins.map(plugin => plugin.name))
)

module.exports.pluginPackageJson = (pluginName, branch) => (
  api.get(`${BASE_GITHUB_RAW_URL}/rispa-io/${pluginName}/${branch}/package.json`)
    .then(({ data }) => data)
)
