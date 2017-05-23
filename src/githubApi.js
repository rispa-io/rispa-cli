'use strict';

const axios = require('axios');

const BASE_URL = 'https://api.github.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

module.exports = {
  plugins() {
    return api.get("/search/repositories?q=user:rispa-io+topic:rispa-plugin")
  }
}