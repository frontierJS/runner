import Runner from './index.js'

const $ = Runner()

const main = async () => {
  await $`
    user ${3}
  `

  console.log($._values)
  console.log($._commands._abort.toString())
  console.log($.Queue.zip)
}
main()
