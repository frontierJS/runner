// import { validate } from 'indicative/validator.js'
// import { sanitize } from 'indicative/sanitizer.js'
import Util from './Util.js'
const { til } = Util

export default Prop

function Prop (spec) {
  const { Proc, Queue, Command, Log } = spec
  return {
    results: [],
    _abort (e) {
      Proc.abort(e)
    },
    /**
     * validates the rules
     * @param {array} rules optional
     */
    // async _validate (rules) {
    //   if (rules === spec) {
    //     const [key] = Queue.events[0]
    //     if (key !== 'rules') {
    //       return 'failure: no other registers exist'
    //     }
    //     const [, expression] = Queue.events.shift()
    //     rules = Queue.resolve(expression)
    //     // return await self.Command.validate(self.Queue.events)
    //   }
    //   const data = Object.keys(rules).reduce((acc, key) => {
    //     acc[key] = Queue.events.find(([name, exp]) => name === key)[1]
    //     return acc
    //   }, {})
    //   if (rules === spec) {
    //     return await til(validate(data, rules))
    //   }
    //   return await validate(data, rules)
    // },
    // async _sanitize (rules) {
    //   if (!rules) {
    //     const [key] = Queue.events[0]
    //     if (key === 'rules') {
    //       await Command.sanitize(Queue.events)
    //     } else {
    //       return 'failure: no other registers exist'
    //     }
    //   } else {
    //     const data = Object.keys(rules).reduce((acc, key) => {
    //       acc[key] = Queue.events.find(([name, exp]) => name === key)[1]
    //       return acc
    //     }, {})
    //     return await validate(data, rules)
    //   }
    // },
    _assign () {
      Log.add('assigning')
      Queue.events.map(Command.assign)
    },
    async _register () {
      Log.add('registering')
      const [key] = Queue.events[0]
      if (key === 'command') {
        await Command.register(Queue.events)
      } else {
        return 'failure: no other registers exist'
      }
    },
    _queue () {
      Log.add('Actions have been queued')
    },
    _run () {
      Log.add('running')
      const completed = Queue.events.every(Queue.run)
      Log.add('Run Complete? ' + completed)
    },
    _runIgnore () {
      Log.add('running: Ignoring exceptions')
      Queue.events.forEach(Queue.run)
    },
    async _runAsync () {
      Log.add('running async')
      // const completed = self.Queue.events.every(self.Command.runAsync)
      // self.Log.add('Run Complete? ' + completed)
      await Command.runAsync(Queue.events)
    },
    _clear () {
      Queue.events.clear()
    },
    _debug () {
      Proc.debug()
    },
    _rebug () {
      Proc.rebug()
    }
  }
}
