import { Lighting } from "./lighting.mjs"

// using fetch to load in a journal file
async function load_journal(name) {
  return await fetch("journal/" + name)
    .then(response => response.text())
    .then(text => text)
}

// load links from file as json
async function load_meta() {
  return await fetch("journal/meta.json")
    .then(response => response.json())
    .then(json => json)
}

// encode links in the text
function encode_links(text, links) {
  // loop through all the links
  for (let link of links) {
    // verify link has name
    if (!link.name) throw "link missing name"
    // verify link has url
    if (!link.url) continue
    let link_tag_start = `<a href="${link.url}"`
    if (link.tooltip) link_tag_start += ` title="${link.tooltip}"`
    link_tag_start += ">"
    // replace the link in the text with the encoded link
    text = text.replace(link.name, link_tag_start + link.name + "</a>")
  }
  return text
}

function encode_lights(text, lights) {
  // loop through all the lights
  for (let light of lights) {
    // verify light has name
    if (!light.name) throw "light missing name"
    let light_tag_start = `<span class="light"`
    if (light.brightness) light_tag_start += ` brightness="${light.brightness}"`
    light_tag_start += ">"
    // replace the light in the text with the encoded light
    text = text.replace(light.name, light_tag_start + light.name + "</span>")
  }
  return text
}

// add lights to the text
function add_lights(elem, lights) {
  let text = ""
  elem.childNodes.forEach(child => {
    if (child.nodeType == Node.TEXT_NODE) {
      text += encode_lights(child.textContent, lights)
    // recurse
    } else {
      add_lights(child, lights)
      text += child.outerHTML
    }
  })
  elem.innerHTML = text
}

window.onload = async () => {
  // load in first journal entry
  let text = await load_journal('day1.cave')
  // load metadata 
  const meta = await load_meta()
  // load links into text
  text = encode_links(text, meta.links)
  // fill #journal with the text
  const journal = document.querySelector("#journal")
  journal.innerHTML = text
  // add lights
  add_lights(journal, meta.lights)
  const lighting = new Lighting(journal)
  setInterval(() => {
    lighting.draw()
  }, 50)
}