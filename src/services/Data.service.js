// explanation: this saves handling form data in each component who communicates with the server.
import axios from 'axios'

// create and update (multipart/form-data)
const service = (path, method, data = {}) => {
  var formData = new FormData()
  if (data !== {}) {
    for (let key in data) {
      formData.append(key, data[key])
    }
  }
  return axios({
    url: path,
    method,
    headers: { 'content-type': 'multipart/form-data' },
    data: formData
  })
}

export default service

// TODO:
// * do this: mdn idempotence: the first call of a DELETE will likely return a 200, while successive ones will likely return a 404.
// * look for another word for a user that is claiming to be someone but not yet verified.
