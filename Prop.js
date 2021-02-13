import { validate } from 'indicative/validator.js'
import { sanitize } from 'indicative/sanitizer.js'
const til = (p) => {
  return Promise.resolve(p).then(
    (r) => ({ ok: r, error: undefined }),
    (e) => ({ ok: undefined, error: e })
  )
}
export default Prop

function Prop (self) {
  return {
    results: [],
    _abort (e) {
      self.Proc.abort(e)
    },
    /**
     * validates the rules
     * @param {array} rules optional
     */
    async _validate (rules) {
      if (rules === self) {
        const [key] = self.Queue.events[0]
        if (key !== 'rules') {
          return 'failure: no other registers exist'
        }
        const [, expression] = self.Queue.events.shift()
        rules = self.Queue.resolve(expression)
        // return await self.Command.validate(self.Queue.events)
      }
      const data = Object.keys(rules).reduce((acc, key) => {
        acc[key] = self.Queue.events.find(([name, exp]) => name === key)[1]
        return acc
      }, {})
      if (rules === self) {
        return await til(validate(data, rules))
      }
      return await validate(data, rules)
    },
    async _sanitize (rules) {
      if (!rules) {
        const [key] = self.Queue.events[0]
        if (key === 'rules') {
          await self.Command.sanitize(self.queue.events)
        } else {
          return 'failure: no other registers exist'
        }
      } else {
        const data = Object.keys(rules).reduce((acc, key) => {
          acc[key] = self.Queue.events.find(([name, exp]) => name === key)[1]
          return acc
        }, {})
        return await validate(data, rules)
      }
    },
    _assign () {
      self.Log.add('assigning')
      self.Queue.events.map(self.Command.assign)
    },
    async _register () {
      self.Log.add('registering')
      const [key] = self.Queue.events[0]
      if (key === 'command') {
        await self.Command.register(self.Queue.events)
      } else {
        return 'failure: no other registers exist'
      }
    },
    _queue () {
      self.Log.add('Actions have been queued')
    },
    _run () {
      self.Log.add('running')
      const completed = self.Queue.events.every(self.Queue.run)
      self.Log.add('Run Complete? ' + completed)
    },
    _runIgnore () {
      self.Log.add('running: Ignoring exceptions')
      self.Queue.events.forEach(self.Queue.run)
    },
    async _runAsync () {
      self.Log.add('running async')
      // const completed = self.Queue.events.every(self.Command.runAsync)
      // self.Log.add('Run Complete? ' + completed)
      await self.Command.runAsync(self.Queue.events)
    },
    _clear () {
      self.Queue.events.clear()
    },
    _debug () {
      self.Proc.debug()
    },
    _rebug () {
      self.Proc.rebug()
    }
  }
}
