import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8800/api/',
  withCredentials: true,
  withXSRFToken: true,
})

const csrf = axios.create({
  baseURL: 'http://localhost:8800',
  withCredentials: true,
})

export { api, csrf }
