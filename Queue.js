import Util from './Util.js'
const { isF } = Util

export default Queue

function Queue (self) {
  const { Proc } = self
  return {
    events: [],
    finished: [],
    get (event) {
      const [name, expression, type, exception] = event
      return { name, expression, type, exception }
    },
    resolve (exp) {
      if (isF(exp)) {
        return exp(self)
      } else {
        return exp
      }
    },
    load (events) {
      this.events = this.events.concat(events)
    },
    unload () {
      this.events.clear()
    },
    updateRan () {
      this.finished = this.finished.concat(self.Queue.events)
    },
    run (event) {
      const { name, expression: exp, type, exception } = this.get(event)
      let result = this.resolve(exp)
      // TODO: clean up
      if (exception && Proc.maybeCheck(result)) {
        console.log('got exception')
        const err = Proc.checkException(result, exception)
        if (err) {
          console.log('err in loop')
          if (err.kill) {
            // Do we kill the loop?
            // break loop
            // return
            console.log('klling loop on exception')
            return false
          }
          result = result.err
        } else {
          result = result.ok
        }
      }

      // TODO fix this
      const names = name.split('.')

      if (names.length > 1) {
        self[names[0]][names[1]] = result
      } else {
        Proc.set(names[0], result)
      }

      self.results.push(result)
      Proc.set(Proc.lastResponse, result)
      this.finished.push(event)

      return true
    }
  }
}
