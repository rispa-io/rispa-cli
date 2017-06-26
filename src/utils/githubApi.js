const axios = require('axios')
const { GITHUB_SEARCH_PLUGINS_QUERY } = require('../constants')

const api = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 10000,
})

module.exports = {
  plugins() {
    return api.get(`/search/repositories?${GITHUB_SEARCH_PLUGINS_QUERY}`)
  },
}
