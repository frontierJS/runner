import Runner from './Runner.js'

export default Runner
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
