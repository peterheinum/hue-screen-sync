require('dotenv').config({ path: __dirname + '../../.env' })
const sleep = async time => new Promise(resolve => setTimeout(() => resolve(), time))
const flat = arr => arr.reduce((acc, cur) => [...acc, ...cur],[])
const rand = max => Math.floor(Math.random() * max)
const isEqual = (a, b) => JSON.stringify(a) == JSON.stringify(b)
const hue_hub = () => process.env.HUE_HUB
const api_key = () => process.env.API_KEY
const emptyArray = (array) => array.splice(0, array.length)
const baseHueUrl = key => `http://${hue_hub()}/api/${key || api_key()}`
const objToArrayWithKeyAsId = obj => Object.keys(obj).map(key => ({ ...obj[key], id: key }))

const requireUncached = _module => {
  delete require.cache[require.resolve(_module)]
  return require(_module)
}

const shadeRGBColor = (color, percent) => {
  var f = color.split(','), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = parseInt(f[0].slice(4)), G = parseInt(f[1]), B = parseInt(f[2])
  return 'rgb(' + (Math.round((t - R) * p) + R) + ',' + (Math.round((t - G) * p) + G) + ',' + (Math.round((t - B) * p) + B) + ')'
}

module.exports = {
  flat,
  rand,
  sleep,
  isEqual, 
  emptyArray, 
  baseHueUrl,
  shadeRGBColor,
  requireUncached,
  objToArrayWithKeyAsId,
}