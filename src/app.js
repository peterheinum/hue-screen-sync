require('dotenv').config({ path: __dirname + '../../.env' })
const { assign } = require('lodash')
const rl = require('readline')
const readline = rl.createInterface({ input: process.stdin, output: process.stdout })

/* utils */
const { eventHub } = require('./utils/eventHub')
const convertRgbToBytes = require('./utils/convertRgbToBytes')
const { getEntertainmentGroups } = require('./utils/helpers')
const { startPoll, stopPoll } = require('./screen/screenRecorder.js')
const { getGroupsAndStopStreams, startStream } = require('./hue/socket')

const state = {
  id: null,
  lights: [],
  locations: {}
}

const askForInput = async msg => new Promise((resolve, reject) =>
  readline.question(`${msg}: `, input => resolve(parseInt(input)))
)

const pickGroup = () => getEntertainmentGroups()
  .then(async groups => {
    const formatMessage = groups => groups.reduce((acc, cur) => acc += `enter ${cur.id} for ${cur.name} \n`, '')
    const input = await askForInput(formatMessage(groups))

    const condition = ({ id }) => id == input
    const group = groups.find(condition)
    return Promise.resolve(group)
  })


const giveLightsLocations = () => {
  //TODO Not hardcode locations
  const locations = [
    ['1', 'top'],
    ['2', 'left'],
    ['5', 'right'],
    ['6', 'bottom'],
  ]

  const getLocationForId = _id => locations.find(([id]) => id == _id)[1]

  const lights = state.lights.map(id => ({ id, location: getLocationForId(id) }))
  assign(state, { lights })
}

const createSocketMessage = screen => {
  const { lights } = state
  /* TODO Add brightness depending on the subjective brightness of a rgb */
  const brightness = 0x00
  const values = lights.map(({ location }) => convertRgbToBytes(...screen[location])).reduce((acc, cur, index) => ({ ...acc, [index]: cur }), {})
  const colorMessage = lights.map(({ id }, index) => [0x00, 0x00, parseInt(id), ...values[index][0], ...values[index][1], brightness, brightness])
  return colorMessage
}

const init = async () => {
  const formatLocations = locations => ({ locations: Object.keys(locations).map(key => ([key, locations[key]])) })
  const fillState = ({ id, lights, locations }) => assign(state, { id, lights, ...formatLocations(locations) })
  const getState = () => ({ ...state })
  
  await pickGroup()
    .then(fillState)
    .then(giveLightsLocations)
    .then(startPoll)

  getGroupsAndStopStreams()
    .then(getState)
    .then(startStream)

  eventHub.on('colorsExtracted', screen => eventHub.emit('emitLight', createSocketMessage(screen)))
}

init()