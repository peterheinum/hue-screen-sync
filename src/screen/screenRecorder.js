const screenshot = require('screenshot-desktop')
const ColorThief = require('colorthief')
const sharp = require('sharp')

const state = {
  height: 0,
  width: 0,
}

const setupState = state => {
  screenshot.listDisplays().then(([display]) => {
    const { height, width } = display
    Object.assign(state, { height, width })
    return Promise.resolve()
  })
}

const extractCorners = async () => {
  const top = 0
  await sharp('./screen.jpg')
    .extract({ left: 0, top, ...state, width: 300 })
    .toFile('left.jpg')

  await sharp('./screen.jpg')
    .extract({ left: state.width - 300, top, ...state, width: 300 })
    .toFile('right.jpg')

  return Promise.resolve()
}

const getColors = async () => {
  const left = []
  const right = []

  await ColorThief.getPalette('./left.jpg', 2)
    .then(colors => left.push(...colors))

  await ColorThief.getPalette('./right.jpg', 2)
    .then(colors => right.push(...colors))

  return Promise.resolve({ left, right })
}


const init = async () => {
  await setupState(state)
  await screenshot({ filename: 'screen.jpg' })
  await extractCorners()
  await getColors()
  
}

init()