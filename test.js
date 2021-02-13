import { validate } from 'indicative/validator.js'
import { sanitize } from 'indicative/sanitizer.js'
import Runner from './Runner.js'

const main = async () => {
  const $ = Runner()
  // what happens to promises and async functions
  const app = {}
  const User = {
    // import DB
    // import Util
    // import Env
    async getUsers (req, res) {
      // arrange
      const cxt = {
        email: req.body.email,
        rules: { email: 'required|min:4' },
        clean: { email: 'slug' },
        sql: sql`select * from users where email = $email`
      }
      // act
      await $`runAsync
        email        ${() => cxt.email}
        isValid?     ${() => $._validate(cxt.rules)} | abort
        cleanedEmail ${() => $._sanitize(cxt.clean)}
        user         ${() => DB.raw(cxt.sql, { email: $.cleanedEmail })} | send404
        response     ${() => ({ user: $.user })}
      `
      // assert
      req.send($.response)
    }
  }

  app.get('/users/:id', User.getUsers)
  const args = { username: 'required|min:3' }
  await $`debug|register
    command ${{ name: 'addKnight', after: 'runAsync' }}
    name  ${() => $._validate(args)} | send404
    response ${() => $.username + ' Knight'}
  `

  await $`addKnight
    username ${'jordain'}
  `

  console.log($.prev)
  // console.log({ v: $.valid })
  // console.log({ user: $.user })
  // console.log($._commands)
  // console.log($._internal)
  console.log($._values)
}

main()
