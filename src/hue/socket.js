require('dotenv').config({ path: __dirname + '../../.env' })
const dtls = require('node-dtls-client').dtls
const axios = require('axios')
const { baseHueUrl, flat, getEntertainmentGroups } = require('../utils/helpers')
const { eventHub } = require('../utils/eventHub')

const hueUserName = process.env.HUE_CLIENT_KEY
const hueClientKey = Buffer.from(process.env.HUE_CLIENT_SECRET, 'hex')
const baseGroupUrl = `${baseHueUrl(hueUserName)}/groups`



const stopStream = async id => {
  await axios.put(`${baseGroupUrl}/${id}`, { stream: { active: false } })
  return Promise.resolve()
}

const stopEachStream = groups => new Promise((resolve, reject) =>
  Promise.all(groups.map(({ id }) => stopStream(id)))
    .then(resolve)
    .catch(reject)
)

const getGroupsAndStopStreams = () => new Promise((resolve, reject) =>
  getEntertainmentGroups()
    .then(stopEachStream)
    .then(resolve)
    .catch(reject)
)

const startStream = async state => {
  const restart = state => getGroupsAndStopStreams().then(() => startStream(state))

  unsafeStartStream(state)
    .catch(() => restart(state))
}

const unsafeStartStream = ({ id }) => {
  axios.put(`${baseGroupUrl}/${id}`, { stream: { active: true } })
    .then(() => {
      const options = {
        type: 'udp4',
        address: process.env.HUE_HUB,
        port: 2100,
        psk: { [hueUserName]: hueClientKey },
        timeout: 1000
      }

      const socket = dtls.createSocket(options)

      socket
        .on('connected', e => {
          console.log('connected')
          eventHub.on('emitLight', colorMessage => {
            const message = Buffer.concat([
              Buffer.from("HueStream", "ascii"),
              Buffer.from([
                0x01, 0x00,

                0x07,

                0x00, 0x00,

                0x00,

                0x00,

                ...flat(colorMessage)
              ])
            ])
            socket.send(message)
          })
        })
        .on('error', e => {
          console.log('ERROR', e)
        })
        .on('message', msg => {
          console.log('MESSAGE', msg)
        })
        .on('close', e => {
          eventHub.on('emitLight', () => console.log('nah bruv socket is not connect'))
          console.log('CLOSE', e)
        })
    })
}

module.exports = { getGroupsAndStopStreams, startStream }