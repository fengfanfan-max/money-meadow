import '@testing-library/jest-dom/vitest'

// jsdom has no layout engine and no Web Animations API. Anything the app touches
// that jsdom lacks gets a minimal, honest stub here so tests exercise real logic
// rather than crashing on a missing browser API.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

if (!window.HTMLMediaElement.prototype.play) {
  window.HTMLMediaElement.prototype.play = () => Promise.resolve()
}

// The app deliberately degrades to "silent" when Web Audio is unavailable.
// Tests assert that behaviour instead of relying on a real AudioContext.
