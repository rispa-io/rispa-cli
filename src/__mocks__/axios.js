/* eslint-disable import/no-dynamic-require, global-require */

const axios = jest.genMockFromModule('axios')

let mockData = {
}

axios.setMockData = data => { mockData = data }

axios.create = () => ({
  get(url) {
    const data = mockData[url]
    if (data) {
      return Promise.resolve({ data })
    }
    return Promise.reject({})
  },
})

module.exports = axios
