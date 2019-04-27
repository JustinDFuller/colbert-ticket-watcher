const http = require('https')
const zlib = require('zlib')
const url = require('url')
const nodemailer = require('nodemailer')

let found = false
const dates = new Map()

const uri = url.parse(
  'https://s3-us-west-1.amazonaws.com/data.1iota.com/project/536/details/647c27bb-69a4-4678-b2f8-d6145b3461e6/data.json'
)
uri.headers = { 'accept-encoding': 'gzip' }

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASS
  }
})

const mailOptions = {
  from: process.env.USER,
  to: process.env.USER,
  subject: 'Steven Colbert Tickets'
}

function main () {
  console.log(new Date())
  mailOptions.html = ''

  const today = new Date().toDateString()
  const request = http.get(uri, function (res) {
    const buffers = []
    res
      .pipe(zlib.createGunzip())
      .on('data', function (chunk) {
        buffers.push(chunk)
      })
      .on('end', async function () {
        const json = JSON.parse(Buffer.concat(buffers).toString())
        const events = json.events.filter(
          e => new Date(e.startDateUTC) > new Date('2019-05-27T21:00:00Z')
        ).length
        const mostRecentEvent = new Date(
          json.events[json.events.length - 1].startDateUTC
        )

        if (events.length && !found) {
          found = true
          mailOptions.html = 'events are ready: ' + mostRecentEvent
        } else if (!dates.get(today)) {
          // only send once per day
          dates.set(today, true)
          mailOptions.html = 'no events yet: ' + mostRecentEvent
        }

        // only send if .html has been set
        if (mailOptions.html) {
          console.log(mailOptions.html)
          transporter.sendMail(mailOptions, function (err, info) {
            if (err) {
              console.log(err)
            } else {
              console.log(info)
            }
          })
        }
      })
  })

  request.end()
}

// run every hour
setInterval(main, 1000 * 60 * 60)
main()
