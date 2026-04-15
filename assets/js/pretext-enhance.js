import { prepare, layout } from '@chenglou/pretext'
import { PRETEXT_SCOPES, markReady, readFont, readLineHeight } from './pretext-targets.js'

function enhanceExcerpt(element) {
  const width = element.clientWidth

  if (!width) {
    return
  }

  const text = element.textContent?.trim()

  if (!text) {
    return
  }

  const prepared = prepare(text, readFont(element))
  const metrics = layout(prepared, width, readLineHeight(element))

  markReady(element, metrics)
}

function runEnhancements() {
  document.querySelectorAll(PRETEXT_SCOPES.excerpt).forEach(enhanceExcerpt)
}

let resizeTimer = 0

window.addEventListener('load', runEnhancements, { once: true })
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(runEnhancements, 150)
})
