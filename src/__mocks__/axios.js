/* eslint-disable import/no-dynamic-require, global-require */

const axios = jest.genMockFromModule('axios')

let mockData = {
}

axios.setMockData = data => { mockData = data }

axios.create = () => ({
  get(url) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = mockData[url]
        if (data) {
          resolve({ data })
        } else {
          reject({})
        }
      }, 0)
    })
  },
})

module.exports = axios
