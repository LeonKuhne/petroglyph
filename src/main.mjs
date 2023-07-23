import { Lighting } from "./lighting.mjs"

document.load_entry = async (name) => {
  let text = await load_journal(name + ".cave")   // load journal entry
  const meta = await load_meta()        // load metadata 
  text = encode_links(text, meta.links) // load links into text
  const journal = document.querySelector("#journal")
  journal.innerHTML = text
  // add lighting
  add_lights(journal, meta.lights)
  lighting = new Lighting(journal)
  // update query param url
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get("entry") != name) {
    urlParams.set("entry", name)
    window.history.pushState(null, '', `${window.location.pathname}?${urlParams}`);
  }
  // update page title
  document.title = `${name} | Petroglyph`
}

// using fetch to load in a journal file
async function load_journal(name, tries=0) {
  // load journal entry from journal/name
  // use journal/404.cave if request fails
  return await fetch(`journal/${name}`)
    .then(response => {
      if (response.ok) {
        return response.text()
      } else {
        throw new Error("404")
      }
    }
  ).catch(error => {
    if (tries < 1) {
      return load_journal("404.cave", tries + 1)
    } else {
      throw error
    }
  })
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
    let link_tag_start = "<a "
    if (link.url) link_tag_start += ` href="${link.url}"`
    if (link.entry) link_tag_start +=` onclick="document.load_entry('${link.entry}')"`
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

var lighting = null

const loadPage = async () => {
  // find entry
  const urlParams = new URLSearchParams(window.location.search)
  const entry = urlParams.get("entry") || "Day 1"
  // load entry
  await document.load_entry(entry)
  setInterval(() => {
    lighting.draw()
  }, 50)

}
window.onload = loadPage

window.addEventListener("popstate", event => {
  loadPage()
})