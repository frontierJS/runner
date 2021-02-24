
export default Log

function Log (self) {
  const { Proc } = self
  return {
    logs: [],
    latest: undefined,
    add (msg) {
      const note = `${JSON.stringify(msg)} : ${new Date().toJSON()}`
      this.latest = note
      this.logs.push(note)
      if (Proc.logging) console.log(msg)
    }
  }
}
