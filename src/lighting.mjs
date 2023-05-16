
export class Lighting {
  static GLOW = [0.01, 0.02, 0.03]
  static COLOR = [255, 230, 200]
  static DARK_RATE = 0.007
  static TORCH_GROW_RATE = 0.1
  static EMIT_GROW_RATE = 1
  static TORCH_SHRINK_RATE = 0.01
  static TORCH_MAX = 17
  static TORCH_MIN = 5
  static TORCH_RADIUS = 6

  constructor(journal) {
    // setup characters
    this.spans = span_chars(journal)
    this.lights = []
    this.mouse_light = null 
    // use mouse as light source
    window.addEventListener("mousemove", event => {
      this.move_torch(event.clientX, event.clientY)
    })
    // move fingers
    window.addEventListener("touchmove", event => {
      for (let touch of event.touches) {
        this.emit(touch.clientX, touch.clientY)
      }
    })
    // tap screen
    window.addEventListener("touchstart", event => {
      for (let touch of event.touches) {
        this.emit(touch.clientX, touch.clientY)
      }
    })
    // add static light sources
    window.addEventListener("resize", event => {
      this.lights = []
      for (let elem of document.querySelectorAll("span.light")) {
        let x = elem.offsetLeft + elem.offsetWidth / 2
        let y = elem.offsetTop + elem.offsetHeight / 2
        let brightness = elem.getAttribute("brightness")
        this.lights.push(new Light(x, y, brightness))
      }
      this.draw()
    })
    window.dispatchEvent(new Event("resize"))
  }

  emit(x, y, iterations=20, light=null) {
    if (light == null)
      light = new Light(x, y, Lighting.TORCH_MIN)
      this.lights.push(light)
    const rand_offset = () => 
      (Math.random() * 2 - 1) * Lighting.TORCH_RADIUS * 2
    setTimeout(() => {
      if (iterations > 0) {
        // move the light source randomly
        light.x += rand_offset()
        light.y += rand_offset()
        light.brightness += Lighting.EMIT_GROW_RATE
        this.emit(x, y, iterations - 1, light)
      } else {
        // remove the light source
        light.brightness = 0
      }
    }, 100)
  }

  move_torch(x, y) {
    if (this.mouse_light) {
      this.mouse_light.x = x
      this.mouse_light.y = y
    } else {
      this.mouse_light = new Light(x, y, 0, true)
    }
    let brightness = this.mouse_light.brightness
    brightness += Lighting.TORCH_GROW_RATE
    brightness = Math.min(Math.max(brightness, Lighting.TORCH_MIN), Lighting.TORCH_MAX)
    this.mouse_light.brightness = brightness
    this.draw()
  }

  draw() {
    let lights = [...this.lights]
    if (this.mouse_light) lights.push(this.mouse_light)
    // dim mouse
    if (this.mouse_light && this.mouse_light.brightness > 0) {
      this.mouse_light.brightness -= Lighting.TORCH_SHRINK_RATE
    }
    this.spans.forEach(span => {
      let color = this.light_span(span, lights)
      // dim the color
      color = apply_brightness(color, -Lighting.DARK_RATE)
      span.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    })
    // remove dead lights
    this.lights = this.lights.filter(light => light.brightness > 0)
  }

  light_span(span, lights=[]) {
    // indicate the enterance, ambient light
    let brightness = 0
    for (let light of lights) {
      brightness += position_brightness(span, light)
    }
    // get previous rgb values from style
    let color = [0, 0, 0]
    if (span.style.color != "") {
      color = elem_rgb(span)
    }
    // blend the color from torch light to black
    if (brightness < 0) return color
    return apply_brightness(color, brightness)
  }
}

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
          text += `<span class="char">${char}</span>`
        }
      })
    } else {
      span_chars(section)
      text += section.outerHTML
    }
  })
  // set the new text
  elem.innerHTML = text
  return elem.querySelectorAll("span.char")
}

function apply_brightness(colors, amount) {
  return Object.entries(colors).map(entry => {
    let [index, color] = entry
    color += amount * Lighting.GLOW[index] * 255
    color *= Lighting.COLOR[index] / 255
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

export class Light {
  constructor(x, y, brightness, ignore_scroll=false) {
    this.x = x
    this.y = y
    this.ignore_scroll = ignore_scroll
    this.brightness = brightness
  }
}

export function position_brightness(span, light) {
  // get the span position
  let span_x = span.offsetLeft + span.offsetWidth / 2
  let span_y = span.offsetTop + span.offsetHeight / 2
  // account for scroll position
  span_x -= window.scrollX
  span_y -= window.scrollY
  let light_x, light_y
  if (light.ignore_scroll) {
    light_x = light.x
    light_y = light.y
  } else {
    light_x = light.x - window.scrollX
    light_y = light.y - window.scrollY
  }
  // get the distance between the mouse and the span
  let distance = Math.sqrt(
    Math.pow(light_x - span_x, 2) + Math.pow(light_y - span_y, 2))
  // apply S curve
  //let brightness = 1 / (1 + Math.pow(Math.E, -distance))
  // if on mobile amplify radius
  let brightness = light.brightness - distance / Lighting.TORCH_RADIUS
  return Math.max(0, brightness)
}

