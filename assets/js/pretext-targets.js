export const PRETEXT_SCOPES = {
  excerpt: '[data-pretext-scope="excerpt"]',
}

export function readFont(element) {
  const style = window.getComputedStyle(element)
  return [
    style.fontStyle,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
  ].join(' ')
}

export function readLineHeight(element) {
  const style = window.getComputedStyle(element)
  const parsed = Number.parseFloat(style.lineHeight)

  if (!Number.isNaN(parsed)) {
    return parsed
  }

  return Number.parseFloat(style.fontSize) * 1.4
}

export function markReady(element, metrics) {
  element.dataset.pretextReady = 'true'
  element.style.setProperty('--pretext-height', `${metrics.height}px`)
  element.style.setProperty('--pretext-lines', `${metrics.lineCount}`)
}
