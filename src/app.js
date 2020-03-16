require('dotenv').config({ path: __dirname + '../../.env' })
const axios = require('axios')
const { get, assign, flatten } = require('lodash')
const rl = require('readline')
const readline = rl.createInterface({ input: process.stdin, output: process.stdout })

const { eventHub } = require('./utils/eventHub')
const convertRgbToBytes = require('./utils/convertRgbToBytes')
const { baseHueUrl, objToArrayWithKeyAsId } = require('./utils/helpers')
const { startPoll, stopPoll } = require('./screen/screenRecorder.js')



const hueUserName = process.env.HUE_CLIENT_KEY
const hueClientKey = Buffer.from(process.env.HUE_CLIENT_SECRET, 'hex')
const baseGroupUrl = `${baseHueUrl(hueUserName)}/groups`

const stopStream = async id => axios.put(`${baseGroupUrl}/${id}`, { stream: { active: false } })

const state = {
  id: null,
  lights: [],
}

const getEntertainmentGroups = () => {
  const condition = ({ type }) => type == 'Entertainment'
  const onlyEntertainment = arr => arr.filter(condition)
  const getData = obj => get(obj, 'data')

  return new Promise((resolve, reject) => {
    axios
      .get(baseGroupUrl)
      .then(getData)
      .then(objToArrayWithKeyAsId)
      .then(onlyEntertainment)
      .then(resolve)
      .catch(reject)
  })
}

const askForInput = async msg => new Promise((resolve, reject) =>
  readline.question(`${msg}: `, input => resolve(parseInt(input)))
)

const pickGroup = async () => await getEntertainmentGroups()
  .then(async groups => {
    const formatMessage = groups => groups.reduce((acc, cur) => acc += `enter ${cur.id} for ${cur.name} \n`, '')
    const input = await askForInput(formatMessage(groups))

    const condition = ({ id }) => id == input
    const group = groups.find(condition)
    return Promise.resolve(group)
  })


const init = () => {
  const fillState = ({ id, lights, locations }) => assign(state, { id, lights, locations })

  pickGroup()
    .then(fillState)
    .then(startPoll)
  
  eventHub.on('colorsExtracted', ({ left, right, top, bottom }) => {
    const createSocketMessage = () => {
      const { lights } = state
      const brightness = 0x00
      const values = lights.map(() => convertRgbToBytes(...top)).reduce((acc, cur, index) => ({...acc, [index]: cur }), {})
      // const lightAndColorArray = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...flatten(values[index]), brightness, brightness])
      const lightAndColorArray = lights.map((id, index) => [0x00, 0x00, parseInt(id), ...values[index][0], ...values[index][1], brightness, brightness])
      const turnedofLights = lights.map(id => [0x00, 0x00, parseInt(id), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
      console.log(right)
    }
    
    createSocketMessage()
  })
}
init()