import Bootstrap from './Prop.js'
import Command from './Command.js'
import Queue from './Queue.js'
import Proc from './Proc.js'
import Parser from './Parser.js'
import Exception from './Exception.js'
import Log from './Log.js'
import Util from './Util.js'

const { keyRegex } = Util

export default Runner

function Runner (spec = {}) {
  const self = async function runner (strings, ...expressions) {
    const { events, commands } = parser.parse(strings, expressions)
    self.Queue.load(events)
    await self.Command.run(commands)

    return self
  }

  // Why must these be loaded in order?
  self.Proc = Proc(self)
  self.Queue = Queue(self)
  self.Log = Log(self)
  const parser = Parser(self)
  self.Command = Command(self)
  self.Exception = Exception(self)

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
