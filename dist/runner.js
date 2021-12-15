/* eslint no-extend-native: ["error", { "exceptions": ["Array", "Object"] }] */
Object.filter = function (obj, predicate) {
  return Object.fromEntries(Object.entries(obj).filter(predicate))
};

Array.prototype.clear = function () {
  this.splice(0, this.length);
};

const Util = {};

Util.trim = function (string) {
  return string.trim()
};

Util.keyRegex = function (regex) {
  return ([key]) => key.match(regex)
};
Util.isP = function (x) {
  return !!x && Util.isF(x.then)
};

Util.isF = function (x) {
  return typeof x === 'function'
};

Util.isAF = function (x) {
  return Util.isF(x) && x.constructor.name === 'AsyncFunction'
};

Util.til = function (p) {
  return Promise.resolve(p).then(
    (r) => ({ ok: r, error: undefined }),
    (e) => ({ ok: undefined, error: e })
  )
};

Util.anyToString = function (valueToConvert) {
    if (valueToConvert === undefined || valueToConvert === null) {
        return valueToConvert === undefined ? "undefined" : "null";
    }
    if (typeof valueToConvert === "string") {
        return `'${valueToConvert}'`;
    }
    if (typeof valueToConvert === "number" ||
        typeof valueToConvert === "boolean" ||
        typeof valueToConvert === "function") {
        return valueToConvert.toString();
    }
    if (valueToConvert instanceof Array) {
        const stringfiedArray = valueToConvert
            .map(property => anyToString(property))
            .join(",");
        return `[${stringfiedArray}]`;
    }
    if (typeof valueToConvert === "object") {
        const stringfiedObject = Object.entries(valueToConvert)
            .map((entry) => {
            return `${entry[0]}: ${anyToString(entry[1])}`;
        })
            .join(",");
        return `{${stringfiedObject}}`;
    }
    return JSON.stringify(valueToConvert);
};

// import { validate } from 'indicative/validator.js'

function Prop (spec) {
  const { Proc, Queue, Command, Log } = spec;
  return {
    results: [],
    _abort (e) {
      Proc.abort(e);
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
      Log.add('assigning');
      Queue.events.map(Command.assign);
    },
    async _register () {
      Log.add('registering');
      const [key] = Queue.events[0];
      if (key === 'command') {
        await Command.register(Queue.events);
      } else {
        return 'failure: no other registers exist'
      }
    },
    _queue () {
      Log.add('Actions have been queued');
    },
    _run () {
      Log.add('running');
      const completed = Queue.events.every(Queue.run);
      Log.add('Run Complete? ' + completed);
    },
    _runIgnore () {
      Log.add('running: Ignoring exceptions');
      Queue.events.forEach(Queue.run);
    },
    async _runAsync () {
      Log.add('running async');
      // const completed = self.Queue.events.every(self.Command.runAsync)
      // self.Log.add('Run Complete? ' + completed)
      await Command.runAsync(Queue.events);
    },
    _clear () {
      Queue.events.clear();
    },
    _debug () {
      Proc.debug();
    },
    _rebug () {
      Proc.rebug();
    }
  }
}

// import { validate as valid } from 'indicative/validator.js'
const { isP: isP$1, isF: isF$2, isAF, til } = Util;
/**
 * Command
 */
function Command (self) {
  const { Proc, Queue, Log, Exception } = self;
  return {
    default: 'runAsync',
    // async validate (events) {
    //   const data = Object.keys(rules).reduce((acc, key) => {
    //     acc[key] = Queue.events.find(([name, exp]) => name === key)[1]
    //     return acc
    //   }, {})

    //   return await valid(data, rules)
    // },
    async run (commands) {
      for await (const cmd of commands) {
        Log.add({ cmd });
        const command = Proc.find(cmd);

        if (!command) {
          Log.add(cmd + ': Command Not Found');
        } else
        if (isAF(command)) {
          await command(self);
        } else
        if (isF$2(command)) {
          command(self);
        }
      }
    },
    async runAsync (events) {
      for await (const event of events) {
        const { name, expression: exp, type, exception } = Queue.get(event);
        Log.add({ name, exp, type, exception });
        let result;
        if (isF$2(exp) && exception) {
          result = await til(exp(self));
        } else
        if (isF$2(exp)) {
          // TODO: fix
          result = await exp(self);
        } else
        if (isP$1(exp)) {
          result = await til(exp);
        } else {
          result = exp;
        }

        if (exception && Proc.maybeCheck(result)) {
          Log.add('has exception and is a Maybe');
          console.log(result);
          const err = Proc.checkException(result, exception);
          if (err) {
            Log.add('err in loop');
            if (err.kill) {
            // Do we kill the loop?
            // break loop
            // return
              Log.add('killing loop on exception');
              break
            }
            result = result.err;
          } else {
            result = result.ok;
          }
        }

        const passedTypeCheck = Proc.checkType(result, type);
        if (!passedTypeCheck) {
          Log.add('Failed type check: ' + type + ' result', result);
          const typeException = exception || 'abort';
          if (typeException) {
            const err = Exception[typeException]({ status: 'TypeError', message: `Required: ${type}, Found: ${typeof result}`, result });
            if (err) {
              Log.add('err in loop' + err);
              if (err.kill) {
                // Do we kill the loop?
                // break loop
                // return
                Log.add('killing loop on exception');
                break
              }
            }
          }
        }

        self.results.push(result);
        Proc.set(name, result);
        Queue.finished.push(event);
      }
    },
    assign (event) {
      const [name, exp, exception] = event;
      Log.add({ name, exp, exception });
      Proc.set(name, exp);
      Proc.checkException(exp, exception);
      Queue.finished.push(event);
    },
    async register (events) {
      const [, expression] = events.shift();
      const { name, before, after } = Queue.resolve(expression);
      const cmd = '_' + name;

      Proc.set(cmd, async () => {
        if (before) await this.run([before]);
        Queue.load(self[cmd].events);
        if (after) await this.run([after]);
      });

      self[cmd].events = [...Queue.events];
      Queue.unload();
    }
  }
}

const { isF: isF$1 } = Util;

function Queue (self) {
  const { Proc } = self;
  return {
    events: [],
    finished: [],
    get (event) {
      const [name, expression, type, exception] = event;
      return { name, expression, type, exception }
    },
    resolve (exp) {
      if (isF$1(exp)) {
        return exp(self)
      } else {
        return exp
      }
    },
    load (events) {
      this.events = this.events.concat(events);
    },
    unload () {
      this.events.clear();
    },
    updateRan () {
      this.finished = this.finished.concat(self.Queue.events);
    },
    run (event) {
      const { name, expression: exp, type, exception } = this.get(event);
      let result = this.resolve(exp);
      // TODO: clean up
      if (exception && Proc.maybeCheck(result)) {
        console.log('got exception');
        const err = Proc.checkException(result, exception);
        if (err) {
          console.log('err in loop');
          if (err.kill) {
            // Do we kill the loop?
            // break loop
            // return
            console.log('killing loop on exception');
            return false
          }
          result = result.err;
        } else {
          result = result.ok;
        }
      }

      // TODO fix this
      const names = name.split('.');

      if (names.length > 1) {
        self[names[0]][names[1]] = result;
      } else {
        Proc.set(names[0], result);
      }

      self.results.push(result);
      Proc.set(Proc.lastResponse, result);
      this.finished.push(event);

      return true
    }
  }
}

const { isP } = Util;

function Proc (self) {
  return {
    storageKey: 'frontier:runner',
    lastResponse: 'prev',
    logging: false,
    prefix: '_',
    find (string) {
      return self[this.prefix + string] || undefined
    },
    abort (error) {
      self.Queue.events.clear();
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
        self.Log.add(response.error);
      }
    },
    debug () {
      self.Proc.logging = true;
    },
    rebug () {
      self.Proc.logging = false;
    },
    set (name, value) {
      self[name] = value;
    },
    loadCommands (commands) {
      Object.entries(commands).forEach(([cmd, func]) => self.Proc.set(cmd, func));
    },
    getStorage() {
      const values = localStorage.getItem(this.storageKey);
      if (values) {
        Object.entries(JSON.parse(values)).forEach(([key, value]) => {
          self[key] = value;
        });
      }

      console.log(`Loaded from storage. Key [${this.storageKey}]`);
    },
    clearStorage() {
      localStorage.removeItem('frontier:runner');
      console.log(`Cleared storage. Key [${this.storageKey}]`);
    },
    preload (preload) {
      self.Log.add(preload.events);
      self.Queue.load(preload.events || []);
      self.Log.add('RUNNING presets');
      self.Command.run(preload.cmds);
    }
  }
}

function trim (string) {
  return string.trim()
}

function Parser (self) {
  return {
    parse (strings, expressions) {
      const { eventNames, commands } = this.parseStrings(strings);
      const events = this.zip(eventNames, expressions);

      return { events, commands }
    },
    parseStrings (strings) {
      const [firstEvent, ...names] = strings;
      let [cmds, eventName = ''] = firstEvent.split('\n');
      cmds = cmds || self.Command.default;

      const eventNames = this.clean([eventName, ...names]);

      const commands = cmds.split('|').map(trim);

      return { commands, eventNames }
    },
    clean (strings) {
      return strings.reduce((acc, name, index) => {
        name = name.trim();
        if (name[0] === '|') {
          name = name.substr(1).split('\n').map(trim);
        }
        if (name === '') {
        // fix this
          return acc
        }

        if (Array.isArray(name)) {
          acc[index - 1].push(name.shift());
          if (name.length === 0) {
            return acc
          }
        }

        const nameType = this.setNameType(name);
        acc.push([nameType]);

        return acc
      }, [])
    },
    setNameType (name) {
      const x = Array.isArray(name) ? name[0] : name;
      const t = x[0];
      if (!'({["\'!?#$@&<'.includes(t)) {
        return [x, 'any']
      }
      if (t === '!') {
        return [x.slice(1).trim(), 'nonnull']
      }
      if (t === '?') {
        return [x.slice(1).trim(), 'boolean']
      }
      if (t === '"' || t === "'") {
        return [x.slice(1, -1).trim(), 'string']
      }
      if (t === '{') {
        return [x.slice(1, -1).trim(), 'object']
      }
      if (t === '[') {
        return [x.slice(1, -1).trim(), 'array']
      }
      if (t === '(') {
        return [x.slice(1, -1).trim(), 'function']
      }
      if (t === '#') {
        return [x.slice(1).trim(), 'number']
      }
      if (t === '$') {
        return [x.slice(1).trim(), 'bigint']
      }
      if (t === '@') {
        return [x.slice(1).trim(), 'date']
      }
      if (t === '&') {
        return [x.slice(1).trim(), 'symbol']
      }
      if (t === '<') {
        return [x.slice(1, -1).trim(), 'promise']
      }
    },
    zip (names, funcs) {
      const events = names.map(([[key, type], ex], i) => {
        const exp = funcs.shift();
        // TODO: what to do with last remaining line commands? logs?
        // can be an optional log message for batch
        return [key, exp, type, ex || undefined]
      });
      // left over expressions get eventsd as anonymous
      // only last anonymous function remains accessible
      funcs.map((exp) => events.push(['_anonymous', exp, 'any', undefined]));
      return events
    }
  }
}

const { isF } = Util;

function Exception (self) {
  return {
    send404 (e) {
      console.log({ status: '404', message: e });
      return { kill: true }
    },
    abort (e, cb) {
      if (isF(cb)) {
        return cb(e)
      }
      console.log({ status: 'abort', message: e });
      return { kill: true }
    }
  }
}

function Log (self) {
  const { Proc } = self;
  return {
    logs: [],
    latest: undefined,
    add (msg) {
      const note = `${JSON.stringify(msg)} : ${new Date().toJSON()}`;
      this.latest = note;
      this.logs.push(note);
      if (Proc.logging) console.log(msg);
    }
  }
}

const { keyRegex, anyToString: anyToString$1 } = Util;

function Runner (spec = {}) {
  const self = async function runner (strings, ...expressions) {
    const { events, commands } = parser.parse(strings, expressions);
    self.Queue.load(events);
    await self.Command.run(commands);
    localStorage.setItem('frontier:runner', JSON.stringify(self._values));
    // save _internals, _values, _commands
    // console.log(self._internal)
    // console.log(self._values)
    // console.log(self._commands)
    return self
  };

  // Why must these be loaded in order?
  self.Proc = Proc(self);
  self.Queue = Queue(self);
  self.Log = Log(self);
  const parser = Parser(self);
  self.Command = Command(self);
  self.Exception = Exception();

  /**
   * Other Props
   * not loaded from Props
   */
  Object.setPrototypeOf(self, Runner);
  Object.defineProperty(self, '_internal', {
    get: () => Object.filter(self, keyRegex(/^[A-Z]/))
  });
  Object.defineProperty(self, '_values', {
    get: () => Object.filter(self, keyRegex(/^[a-z]/))
  });
  Object.defineProperty(self, '_commands', {
    get: () => Object.filter(self, keyRegex(/^_/))
  });

  /**
   * Init
   */
  function init (spec) {
    const { preload } = spec;
    if (preload) {
      self.Proc.preload(preload);
    }
    self.Proc.loadCommands(spec.commands);
  }

  spec.commands = { ...spec.commands, ...Prop(self) };
  init(spec);
  self.Log.add('Returning the Runner');
  return self
}

Runner.Command = {
  make (strings, ...funcs) {
    return Runner().Proc.parse(strings, funcs)
  }
};

/**
 * Runner Framework:
 * We are either interacting with the Runner or the Queue
 * From this we can create more complex runners // Logger, Validator, SQLer, Middlewarer, Tester
 * The Runner: assign prop (add), registering command (add)
 * The Queue: loading, running, clearing
 * Queue.events
 * Queue.finished
 */
/** Example
 * await $`run
 *  responseName ${some.expression} | exception
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
 * - Not composible
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

// Test code
/*
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const wait = async (sec, msg) => {
  const cnt = Array.from({ length: sec })
  for (const [i, v] of cnt.entries()) {
    await sleep(1000)
    console.log(i + 1 + 's')
  }
}

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
  // console.log($._values)
  // console.log($._commands)
  // console.log($._internal)
}

main()
*/

export { Runner as default };
