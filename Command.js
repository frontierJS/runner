import { validate } from 'indicative/validator.js'
import { sanitize } from 'indicative/sanitizer.js'
import Util from './Util.js'
const { isP, isF, isAF, til } = Util

export default Command
/**
 * Command
 */
function Command (self) {
  const { Proc, Queue, Log, Exception } = self
  return {
    default: 'runAsync',
    async validate (events) {
      const data = Object.keys(rules).reduce((acc, key) => {
        acc[key] = Queue.events.find(([name, exp]) => name === key)[1]
        return acc
      }, {})

      return await validate(data, rules)
    },
    async run (commands) {
      for await (const cmd of commands) {
        Log.add({ cmd })
        const command = Proc.find(cmd)

        if (!command) {
          Log.add(cmd + ': Command Not Found')
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
        const { name, expression: exp, type, exception } = Queue.get(event)
        Log.add({ name, exp, type, exception })
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

        if (exception && Proc.maybeCheck(result)) {
          Log.add('has exception and is a Maybe')
          console.log(result)
          const err = Proc.checkException(result, exception)
          if (err) {
            Log.add('err in loop')
            if (err.kill) {
            // Do we kill the loop?
            // break loop
            // return
              Log.add('killing loop on exception')
              break
            }
            result = result.err
          } else {
            result = result.ok
          }
        }

        const passedTypeCheck = Proc.checkType(result, type)
        if (!passedTypeCheck) {
          Log.add('Failed type check: ' + type + ' result', result)
          const typeException = exception || 'abort'
          if (typeException) {
            const err = Exception[typeException]({ status: 'TypeError', message: `Required: ${type}, Found: ${typeof result}`, result })
            if (err) {
              Log.add('err in loop' + err)
              if (err.kill) {
                // Do we kill the loop?
                // break loop
                // return
                Log.add('killing loop on exception')
                break
              }
            }
          }
        }

        self.results.push(result)
        Proc.set(name, result)
        Queue.finished.push(event)
      }
    },
    assign (event) {
      const [name, exp, exception] = event
      Log.add({ name, exp, exception })
      Proc.set(name, exp)
      Proc.checkException(exp, exception)
      Queue.finished.push(event)
    },
    async register (events) {
      const [, expression] = events.shift()
      const { name, before, after } = Queue.resolve(expression)
      const cmd = '_' + name

      Proc.set(cmd, async () => {
        if (before) await this.run([before])
        Queue.load(self[cmd].events)
        if (after) await this.run([after])
      })

      self[cmd].events = [...Queue.events]
      Queue.unload()
    }
  }
}
