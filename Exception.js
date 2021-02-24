import Util from './Util.js'
const { isF } = Util

export default Exception

function Exception (self) {
  return {
    send404 (e) {
      console.log({ status: '404', message: e })
      return { kill: true }
    },
    abort (e, cb) {
      if (isF(cb)) {
        return cb(e)
      }
      console.log({ status: 'abort', message: e })
      return { kill: true }
    }
  }
}
