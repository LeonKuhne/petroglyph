const GLOW = [0.0005, 0.0002, 0.0003]
const DARK_RATE = 0.0005
const RECOVER_DELAY = 100
const dimming = new Set()

export function span_chars(elem) {
  // new text
  let text = ""
  // wrap all text nodes in spans
  elem.childNodes.forEach(section => {
    if (section.nodeType == Node.TEXT_NODE) {
      section.textContent.split("").forEach(char => {
        // ignore spaces/tabs/newlines
        if (char == " " || char == "\n" || char == "\t") {
          text += char
        // wrap character in span
        } else {
          text += `<span>${char}</span>`
        }
      })
    } else {
      //text += section.outerHTML
      span_chars(section)
      text += section.outerHTML
    }
  })
  // set the new text
  elem.innerHTML = text
  // return the spans
  return elem.querySelectorAll("span")
}

function apply_brightness(colors, amount=null) {
  if (amount == null) amount = -DARK_RATE * 255
  return Object.entries(colors).map(entry => {
    let [index, color] = entry
    color += amount * GLOW[index] * 255
    color = Math.floor(color)
    color = Math.max(0, Math.min(255, color))
    return color
  })
}

function elem_rgb(elem) {
  let color = elem.style.color.match(/\d+/g)
  if (color == null) return [0, 0, 0]
  return color.map(color => parseInt(color))
}

function draw_torch(
  span, radius, x, y,
) {
  // indicate the enterance
  let brightness = position_brightness(span, 150, 100, 0)
  // indicate mouse position
  brightness += position_brightness(span, radius, x, y) - 0.5
  // get previous rgb values from style
  let color = [0, 0, 0]
  if (span.style.color != "") {
    color = elem_rgb(span)
  }
  // blend the color from white to torch light to black
  brightness *= 255
  if (brightness < 0) return
  color = apply_brightness(color, brightness)
  // set the color
  span.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  // recover darkness
  if (dimming.has(span)) return
  dimming.add(span)
  dim_span(span)
}

function dim_span(span) {
  let color = elem_rgb(span)
  color = apply_brightness(color)
  if (color[0] == 0 && color[1] == 0 && color[2] == 0) {
    span.style.color = ""
    dimming.delete(span)
    return
  }
  span.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
  setTimeout(() => { 
    dim_span(span, RECOVER_DELAY)
  }, RECOVER_DELAY)
}


// add listeners to all of the spans to highlight characters
export function highlight_characters(spans, radius) {
  // listen for mouse movement
  document.addEventListener("mousemove", event => {
    spans.forEach(span => {
      draw_torch(span, radius, event.clientX, event.clientY)
    })
  })
  document.dispatchEvent(new Event("mousemove"))
}

export function position_brightness(span, radius, x, y) {
  if (!x || !y) return 0
  // get the span position
  let span_x = span.offsetLeft + span.offsetWidth / 2
  let span_y = span.offsetTop + span.offsetHeight / 2
  // get the distance between the mouse and the span
  let distance = Math.sqrt(
    Math.pow(x - span_x, 2) + Math.pow(y - span_y, 2))
  // get the brightness
  return Math.max(0, 1 - distance / radius)
}

