
export default Log

function Log (self) {
  return {
    logs: [],
    latest: undefined,
    add (msg) {
      const note = `${JSON.stringify(msg)} : ${new Date().toJSON()}`
      self.Log.latest = note
      self.Log.logs.push(note)
      if (self.Proc.logging) console.log(msg)
    }
  }
}
