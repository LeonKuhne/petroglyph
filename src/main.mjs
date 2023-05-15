import { highlight_characters, span_chars } from "./torch.mjs"

// using fetch to load in a journal file
async function load_journal(name) {
  return await fetch("journal/" + name)
    .then(response => response.text())
    .then(text => text)
}

// load links from file as json
async function load_links() {
  return await fetch("journal/links.json")
    .then(response => response.json())
    .then(json => json)
}

// encode links in the text
function encode_links(text, links) {
  // loop through all the links
  for (let link of links) {
    // replace the link in the text with the encoded link
    // name, tooltip, url
    text = text.replace(link.name, `<a href="${link.url}" title="${link.tooltip}">${link.name}</a>`)
  }
  return text
}

window.onload = async () => {
  // load in first journal entry
  let text = await load_journal('day1.cave')
  // load links into text
  let links = await load_links()
  text = encode_links(text, links)
  // fill #journal with the text
  let journal = document.querySelector("#journal")
  journal.innerHTML = text
  // setup characters
  let spans = span_chars(journal)
  highlight_characters(spans, 250)
}