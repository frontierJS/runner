function trim (string) {
  return string.trim()
}

export default Parser

function Parser (self) {
  return {
    parse (strings, expressions) {
      const { eventNames, commands } = this.parseStrings(strings)
      const events = this.zip(eventNames, expressions)

      return { events, commands }
    },
    parseStrings (strings) {
      const [firstEvent, ...names] = strings
      let [cmds, eventName = ''] = firstEvent.split('\n')
      cmds = cmds || self.Command.default

      const eventNames = this.clean([eventName, ...names])

      const commands = cmds.split('|').map(trim)

      return { commands, eventNames }
    },
    clean (strings) {
      return strings.reduce((acc, name, index) => {
        name = name.trim()
        if (name[0] === '|') {
          name = name.substr(1).split('\n').map(trim)
        }
        if (name === '') {
        // fix this
          return acc
        }

        if (Array.isArray(name)) {
          acc[index - 1].push(name.shift())
          if (name.length === 0) {
            return acc
          }
        }

        const nameType = this.setNameType(name)
        acc.push([nameType])

        return acc
      }, [])
    },
    setNameType (name) {
      const x = Array.isArray(name) ? name[0] : name
      const t = x[0]
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
        const exp = funcs.shift()
        // TODO: what to do with last remaining line commands? logs?
        // can be an optional log message for batch
        return [key, exp, type, ex || undefined]
      })
      // left over expressions get eventsd as anonymous
      // only last anonymous function remains accessible
      funcs.map((exp) => events.push(['_anonymous', exp, 'any', undefined]))
      return events
    }
  }
}
