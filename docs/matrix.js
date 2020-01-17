// Your standard matrix drop, but with an addition
// Each time a predefined pattern's box are hit
// It will increase the brithness of its box
// Eventually an entire image will show of the pattern

// If you have energy - each cell should be an object...not different arrays

// How much brightness decreases on each tick
// Must be evenly divisble by 100
BRIGHTDELTA = 5 //10

// How much the pattern brightness increases on each 'hit'
// Must be evenly divisble by 100
PATTERNBRIGHTDELTA = 25 // 10

HUE = 120 //120
SATURATION = 80 //90
NEWFLOWCHANCE = 0.99 //0.98

REFRESHINTERVAL = 70 //70

FONTSIZE = 8 //10

// The text to be drawn
TEXTPATTERN = "MIN KATT!"
// Space percent of screen that will not be drawn upon from each edge
// It should therefore not exceed 0.5
// Height (row), Width (column)
PATTERNPADDING = [0.1, 0.01]
TEXTPATTERNFONTSIZE = 20 //15

// Random char from greek alphabet
function getchar() {
  return "&#" + (913 + Math.floor(Math.random()*97))
}

function getHSL(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`
}

// Applied across entrie table
function decreaseBrightnessOfCell(htmltable, metatable, i, j) {
  if (metatable[i][j] > 0) {
    metatable[i][j] -= BRIGHTDELTA
    htmltable[i][j].style.color = getHSL(HUE, SATURATION, metatable[i][j])
  }
}

// For the head of the matrix drop
function maxBrightness(htmltable, metatable, i, j) {
  metatable[i][j] = 100
  htmltable[i][j].style.color = getHSL(HUE, SATURATION, metatable[i][j])
}

// For the pattern to have specific brightness level
function setBrightness(htmltable, level, i, j) {
  htmltable[i][j].style.color = getHSL(HUE, SATURATION, level)
}

// Just decrease everything for now
function decreaseBrightness(htmltable, metatable) {
  for (i=0; i<htmltable.length; i++) {
    for (j=0; j<htmltable[0].length; j++) {
      decreaseBrightnessOfCell(htmltable, metatable, i, j)
    }
  }
}

// Randomly activate cells on the first row
function activtecells(htmltable, metatable, activecells) {
  for (j=0; j<htmltable[0].length; j++) {
    if (Math.random() > NEWFLOWCHANCE) {
      activecells.push([0, j])
      maxBrightness(htmltable, metatable, 0, j)
    }
  }
}

function updateActivecells(htmltable, metatable, activecells) {
  for (i=0; i<activecells.length; i++) {
    nextrow = activecells[i][0]+1
    if (nextrow < htmltable.length) {
      col = activecells[i][1]
      activecells[i] = [nextrow, col]
      maxBrightness(htmltable, metatable, nextrow, col)
    }
    else {
      // All drops at constant speed, so FIFO applies
      activecells.shift()
    }
  }
}


// Update the pattern at every tick
function drawpermanent(pattern,
                        patternBrightness,
                        htmltable,
                        metatable) {
  for (i=0; i<pattern.length; i++) {

    row = pattern[i][0]
    col = pattern[i][1]
    fallingBrightness = metatable[row][col]
    // If the head of the drop hits the pattern, light it up
    if (fallingBrightness == 100) {
      if (patternBrightness[i] < 100) {
        patternBrightness[i] += PATTERNBRIGHTDELTA
      }
    }
    brightness = Math.max(patternBrightness[i], fallingBrightness)
    setBrightness(htmltable, brightness, row, col)
  }
}


function updatematrix(htmltable,
                       metatable,
                       activecells,
                       pattern,
                       patternBrightness) {
  decreaseBrightness(htmltable, metatable)
  updateActivecells(htmltable, metatable, activecells)
  activtecells(htmltable, metatable, activecells)
  drawpermanent(pattern, patternBrightness, htmltable, metatable)
}


// Create initial grid - called once
function filltable(table, htmltable, metatable, rows, cols) {
  for (i=0; i<rows; i++) {
    row = table.insertRow()
    htmltable.push([])
    metatable.push([])

    for (j=0; j<cols; j++) {
      data = row.insertCell()
      data.innerHTML = getchar()
      data.style.padding = 0
      data.style.margin = 0
      htmltable[i].push(data)
      metatable[i].push(0)
      htmltable[i][j].style.color = getHSL(HUE, SATURATION, metatable[i][j])
    }
  }
}

function setBodyStyle(body) {
  body.style.fontSize = `${FONTSIZE}px`
  body.style.borderCollapse = 'collapse'
}


function fullScreenText() {
  // Screen will be bigger than maximized window
  //nrows = Math.ceil(screen.height/FONTSIZE)
  //ncols = Math.ceil(screen.width/FONTSIZE)
  // Each courier letter has 1px padding
  nrows = Math.ceil(window.innerHeight/(FONTSIZE+2))
  ncols = Math.ceil(window.innerWidth/(FONTSIZE+2))
  //document.documentElement.clientWidth
  return [nrows, ncols]
}

function setUpBaseDOM() {
  // Base table element in DOM
  body = document.querySelector("body");
  setBodyStyle(body)

  // Create the table element
  table = document.createElement("table");
  body.appendChild(table)

  return table
}

// Returns a pattern == list of box coords [[row_1, col_1], [row_2, col_2],...]
function calculatePattern(nrows, ncols) {
  // Max and min coordinates (box locations)
  // miny, minx, maxx, maxy. The order is backwards
  // The only reason is to keep the row-major convention
  textBoundingBox = [
    Math.floor(nrows*PATTERNPADDING[0]),
    Math.floor(ncols*PATTERNPADDING[1]),
    Math.floor(nrows*(1-PATTERNPADDING[0])),
    Math.floor(ncols*(1-PATTERNPADDING[1]))
  ]
  console.log(textBoundingBox)

  canvas = document.createElement("canvas")
  canvas.width = textBoundingBox[3] - textBoundingBox[1]
  canvas.height = textBoundingBox[2] - textBoundingBox[0]
  console.log(canvas.height)
  console.log(canvas.width)

  // Create a virtual context
  ctx = canvas.getContext('2d')
  ctx.font = `${TEXTPATTERNFONTSIZE}px courier`
  // So there is no doubt of which rgb pixel to analyze
  // This does not mean that white text will be drawn to the viewer
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.fillText(TEXTPATTERN, canvas.width/2, canvas.height/2)
  // Get the pixel data as a one dimensional array
  imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  // Reassemble image data into a two dimensional array,
  //   keeping only colored pixels
  pattern = []
  imgstride = canvas.width*4
  for (i=0; i<imgData.length; i+=4) {
    // Magic number for opacity - otherwise letters will be to 'fat'
    if (imgData[i]==255 && imgData[i+3]>80) {
      row = parseInt(i/imgstride)
      col = i - row*imgstride
      // RGBA -> 4x wide row
      // Also adjust for bounding box offset
      pattern.push([row+textBoundingBox[0], col/4+textBoundingBox[1]])
    }
  }

  return pattern
}



// Contains the table row and data tags
htmltable = []
// Current brightnessfpr each data tag
metatable = []
// The dropping character postitions - initially an empty list
// Should preferrably not be a list due to frequent mutations...
activecells = []

// Collect setting information
dims = fullScreenText()
//dims = [30, 60] // Tmp hack for small screens
table = setUpBaseDOM()
filltable(table, htmltable, metatable, dims[0], dims[1])
pattern = calculatePattern(dims[0], dims[1])

// Brightness of the pattern specific boxes
// Will keep increasing as matrix drops hits them
patternBrightness = new Array(pattern.length).fill(0)


// Function to be looped
updateWrapper = function() {
  updatematrix(htmltable,
               metatable,
               activecells,
               pattern,
               patternBrightness)
}

window.setInterval(updateWrapper, REFRESHINTERVAL)
