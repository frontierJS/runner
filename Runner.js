import Bootstrap from './Prop.js'
import Command from './Command.js'
import Queue from './Queue.js'
import Exception from './Exception.js'
import Log from './Log.js'

export default Runner
/**
 * Framework:
 * We are either interacting with the Runner or the Queue
 * From this we can create more complex runners // Logger, Validator, SQLer, Middlewarer, Tester
 * The Runner: assign prop (add), registering command (add)
 * The Queue: loading, running, clearing
 * Queue.events
 * Queue.finished
 */
/** Example
 * await $`run
 *  name ${() => some.expression} |  exception
 * `
 */

/** Docs
 * - Proc
 * - Command
 * - Queue (Queue)
 * - Exceptions
 * - Log
 */

/** Problems it should solve
 * - Error handling (happy path)
 * - Async/Promises
 * - Nested callbacks
 * - Nested/Buried State
 */

/** Examples
 * - App Bootup
 * - Router
 * - Migration
 * - Schema/Model
 * - Query
 * - Test cases
 * - Middleware
 * - Queue Emitters
 * - Components
 * - Adonis/TotalJS/Marble/Nanoexpress
 */

/* eslint no-extend-native: ["error", { "exceptions": ["Array", "Object"] }] */
Object.filter = function (obj, predicate) {
  return Object.fromEntries(Object.entries(obj).filter(predicate))
}

Array.prototype.clear = function () {
  this.splice(0, this.length)
}

function trim (string) {
  return string.trim()
}

function keyRegex (regex) {
  return ([key]) => key.match(regex)
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const wait = async (sec, msg) => {
  const cnt = Array.from({ length: sec })
  for (const [i, v] of cnt.entries()) {
    await sleep(1000)
    console.log(i + 1 + 's')
  }
}

function Runner (spec = {}) {
  const self = async function runner (strings, ...expressions) {
    const { events, commands } = self.Proc.parse(strings, expressions)
    self.Queue.load(events)
    await self.Command.run(commands)

    return self
  }

  /**
   * Main Processes
   */
  const Proc = (self) => ({
    lastResponse: 'prev',
    logging: false,
    abort (error) {
      self.Queue.events.clear()
      return { error }
    },
    maybeCheck (value = {}) {
      if (value.hasOwnProperty('ok') && value.hasOwnProperty('error')) {
        return value
      }

      return false
    },
    checkException (response, exception) {
      if (response?.error && exception) {
        return self.Exception[exception](response.error)
      }

      if (response?.error) {
        self.Log.add(response.error)
      }
    },
    debug () {
      self.Proc.logging = true
    },
    rebug () {
      self.Proc.logging = false
    },
    parse (strings, expressions) {
      const { eventNames, commands } = self.Proc.parseStrings(strings)
      const events = self.Queue.zip(eventNames, expressions)

      return { events, commands }
    },
    parseStrings (strings) {
      const [firstEvent, ...names] = strings
      let [cmds, eventName = ''] = firstEvent.split('\n')
      cmds = cmds || self.Command.default

      names[names.length - 1] || names.pop()

      const eventNames = self.Proc.clean([[eventName.trim()], ...names])

      const commands = cmds.split('|').map(trim)

      return { commands, eventNames }
    },
    clean (strings) {
      return strings.reduce((acc, name, index) => {
        if (Array.isArray(name)) {
          acc.push(name)
          return acc
        }

        name = name.trim()
        if (name[0] === '|') {
          name = name.substr(1).split('\n').map(trim)
        }

        if (Array.isArray(name)) {
          acc[index - 1].push(name.shift())
          acc.push(name)
        } else if (name) {
          acc.push([name])
        }

        return acc
      }, [])
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
  })

  self.Proc = Proc(self)
  self.Command = Command(self)
  self.Queue = Queue(self)
  self.Exception = Exception(self)
  self.Log = Log(self)

  /**
   * Other Props
   * not loaded from Props
   */
  Object.setPrototypeOf(self, Runner)
  Object.defineProperty(self, '_internal', {
    get: () => Object.filter(self, keyRegex(/^[A-Z]/))
  })
  Object.defineProperty(self, '_values', {
    get: () => Object.filter(self, keyRegex(/^[a-z]/))
  })
  Object.defineProperty(self, '_commands', {
    get: () => Object.filter(self, keyRegex(/^_/))
  })

  /**
   * Init
   */
  function init (spec) {
    const { preload } = spec
    if (preload) {
      self.Proc.preload(preload)
    }
    self.Proc.loadCommands(spec.commands)
  }

  spec.commands = { ...spec.commands, ...Bootstrap(self) }
  init(spec)
  self.Log.add('Returning the Runner')
  return self
}

Runner.Command = {
  make (strings, ...funcs) {
    return Runner().Proc.parse(strings, funcs)
  }
}

// Test code
/*
const main = async (context) => {
  const $ = Runner()
  const table = {
    state: 'off',
    up () {
      console.log('booting up')
      this.state = 'on'
    }
  }

  // command ${{ name: "warpToPlanet", before: "run", after: "run" }}
  await $`debug|register
  	command ${{ name: 'warpToPlanet', after: 'run' }}
    user ${{ name: 'jordan' }}
  `
  console.log('tes', $._warpToPlanet.events[0])
  console.log('user ', $.user)
  await $`warpToPlanet
  `
  console.log('user ', $.user)
  await $`migrate
    result ${() => console.log($.tables)}
    user.age ${30}
    user.last ${"Knight"}
    user.getFull ${() => $.user.name + $.user.last}
  `;
  await $`load
    getUser ${(x) => x * 2}
    triple  ${(x = 2) => x * 3}
  `;

  await $`debug|run
    po   ${() => $.triple(9)}
    the  ${() => $.triple($.po)}
    test ${() => $.prev * 2}
  `;

  console.log("results", $.results);
  console.log("results", $.ran);
  console.log("logs", $.logs);
  console.log($._internal);
  console.log($._commands);
  console.log($._values)
}

main()
*/
