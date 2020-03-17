const screenshot = require('screenshot-desktop')
const ColorThief = require('colorthief')
const sharp = require('sharp')
const fs = require('fs')
const { eventHub } = require('../utils/eventHub')

const screenshotPath = 'screen.jpg'
let polling = false

const screen = {
  height: 0,
  width: 0,
}

const setupState = () => {
  screenshot.listDisplays().then(([display]) => {
    const { height, width } = display
    Object.assign(screen, { height, width })
    return Promise.resolve()
  })
}

const extractCorners = async () => {
  const buffer = fs.readFileSync(screenshotPath)
  const leftPath = 'left.jpg'
  const rightPath = 'right.jpg'
  const topPath = 'top.jpg'
  const bottomPath = 'bottom.jpg'

  await sharp(buffer)
    .extract({ left: 0, top: 0, ...screen, width: 50 })
    .toFile(leftPath)

  await sharp(buffer)
    .extract({ left: screen.width - 50, top: 0, ...screen, width: 50 })
    .toFile(rightPath)

  await sharp(buffer)
    .extract({ left: 0, top: 0, ...screen, height: 50 })
    .toFile(topPath)

  await sharp(buffer)
    .extract({ left: 0, top: screen.height - 50, ...screen, height: 50 })
    .toFile(bottomPath)

  return Promise.resolve([leftPath, rightPath, topPath, bottomPath])
}

const getAvarageColor = async imgPath => new Promise((resolve, reject) => ColorThief
  .getColor(imgPath)
  .then(res => resolve(res))
  .catch(err => reject(err)))

const extractColors = async () => {
  await screenshot({ filename: screenshotPath })
  const [leftPath, rightPath, topPath, bottomPath] = await extractCorners()
  const left = await getAvarageColor(leftPath)
  const right = await getAvarageColor(rightPath)
  const top = await getAvarageColor(topPath)
  const bottom = await getAvarageColor(bottomPath)
  eventHub.emit('colorsExtracted', { left, right, top, bottom })
  polling && extractColors()
}

const startPoll = async () => {
  polling = true
  await setupState()
  extractColors()
}
const stopPoll = () => polling = !polling

module.exports = { startPoll, stopPoll }