import { validate } from 'indicative/validator.js'
import { sanitize } from 'indicative/sanitizer.js'

const til = (p) => {
  return Promise.resolve(p).then(
    (r) => ({ ok: r, error: undefined }),
    (e) => ({ ok: undefined, error: e })
  )
}

function isF (x) {
  return typeof x === 'function'
}
function isP (x) {
  return !!x && isF(x.then)
}
function isAF (x) {
  return isF(x) && x.constructor.name === 'AsyncFunction'
}

export default Command
/**
 * Command
 */
function Command (self) {
  return {
    default: 'run',
    prefix: '_',
    find (string) {
      return self[self.Command.prefix + string] || undefined
    },
    async validate (events) {
      const data = Object.keys(rules).reduce((acc, key) => {
        acc[key] = self.Queue.events.find(([name, exp]) => name === key)[1]
        return acc
      }, {})

      return await validate(data, rules)
    },
    async run (commands) {
      for await (const cmd of commands) {
        self.Log.add({ cmd })
        const command = self.Command.find(cmd)

        if (!command) {
          self.Log.add(cmd + ': Command Not Found')
        } else
        if (isAF(command)) {
          await command(self)
        } else
        if (isF(command)) {
          command(self)
        }
      }
    },
    async runAsync (events) {
      for await (const event of events) {
        const [name, exp, exception] = event
        let result
        if (isF(exp) && exception) {
          result = await til(exp(self))
        } else
        if (isF(exp)) {
          // TODO: fix
          result = await exp(self)
        } else
        if (isP(exp)) {
          result = await til(exp)
        } else {
          result = exp
        }
        if (exception && self.Proc.maybeCheck(result)) {
          self.Log.add('has exception and is a Maybe')
          console.log(result)
          const err = self.Proc.checkException(result, exception)
          if (err) {
            self.Log.add('err in loop')
            if (err.kill) {
            // Do we kill the loop?
            // break loop
            // return
              self.Log.add('killing loop on exception')
              break
            }
            result = result.err
          } else {
            result = result.ok
          }
        }
        self.results.push(result)
        self.Proc.set(name, result)
        self.Queue.finished.push(event)
      }
    },
    assign (event) {
      const [name, exp, exception] = event
      // self.Log.add({ name, exp, exception });
      self.Proc.set(name, exp)
      self.Proc.checkException(exp, exception)
      self.Queue.finished.push(event)
    },
    async register (events) {
      const [, expression] = events.shift()
      const { name, before, after } = self.Queue.resolve(expression)
      const cmd = '_' + name

      self.Proc.set(cmd, async () => {
        if (before) await self.Command.run([before])
        self.Queue.load(self[cmd].events)
        if (after) await self.Command.run([after])
      })

      self[cmd].events = [...self.Queue.events]
      self.Queue.unload()
    }
  }
}
