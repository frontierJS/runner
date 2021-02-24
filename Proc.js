import Util from './Util.js'
const { isP } = Util

export default Proc

function Proc (self) {
  return {
    lastResponse: 'prev',
    logging: false,
    prefix: '_',
    find (string) {
      return self[this.prefix + string] || undefined
    },
    abort (error) {
      self.Queue.events.clear()
      return { error }
    },
    checkType (value, type) {
      if (type === 'any') return true
      if (type === 'nonnull') return value !== null || value !== undefined
      if (type === 'date') return value instanceof Date
      if (type === 'array') return Array.isArray(value)
      if (type === 'promise') return isP(value)
      else return typeof value === type
    },
    maybeCheck (value = {}) {
      if (value.hasOwnProperty('ok') && value.hasOwnProperty('error')) {
        return value
      }

      return false
    },
    checkException (response, exception) {
      if (response.error && exception) {
        return self.Exception[exception](response.error)
      }

      if (response.error) {
        self.Log.add(response.error)
      }
    },
    debug () {
      self.Proc.logging = true
    },
    rebug () {
      self.Proc.logging = false
    },
    set (name, value) {
      self[name] = value
    },
    loadCommands (commands) {
      Object.entries(commands).forEach(([cmd, func]) => self.Proc.set(cmd, func))
    },
    preload (preload) {
      self.Log.add(preload.events)
      self.Queue.load(preload.events || [])
      self.Log.add('RUNNNING presets')
      self.Command.run(preload.cmds)
    }
  }
}
