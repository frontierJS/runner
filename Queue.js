function isF (x) {
  return typeof x === 'function'
}

export default Queue

function Queue (self) {
  return {
    events: [],
    finished: [],
    resolve (exp) {
      if (isF(exp)) {
        return exp(self)
      } else {
        return exp
      }
    },
    zip (names, funcs) {
      const events = names.map(([key, ex], i) => {
        const exp = funcs.shift()
        // last remaining line
        // can be an optional log message for batch
        return exp
          ? [key, exp, ex || undefined]
          : ['_lastLog', key]
      })
      // left over expressions get eventsd as anonymous
      // only last anonymous function remains accessible
      funcs.map((exp) => events.push(['_anonymous', exp]))
      return events
    },
    load (events) {
      self.Queue.events = self.Queue.events.concat(events)
    },
    unload () {
      self.Queue.events.clear()
    },
    updateRan () {
      self.Queue.finished = self.Queue.finished.concat(self.Queue.events)
    },
    run (event) {
      const [name, exp, exception] = event
      let result = self.Queue.resolve(exp)
      // TODO: clean up
      if (exception && self.Proc.maybeCheck(result)) {
        console.log('got exception')
        const err = self.Proc.checkException(result, exception)
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
        self.Proc.set(names[0], result)
      }

      self.results.push(result)
      self.Proc.set(self.Proc.lastResponse, result)
      self.Queue.finished.push(event)

      return true
    }
  }
}
