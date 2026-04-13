import './style.css'

const app = document.querySelector('#app')

const levelLayout = [
  { id: 1, x: 17, y: 18, direction: 'right', label: 'Arrow pointing right' },
  { id: 2, x: 52, y: 12, direction: 'down', label: 'Arrow pointing down' },
  { id: 3, x: 80, y: 28, direction: 'left', label: 'Arrow pointing left' },
  { id: 4, x: 23, y: 62, direction: 'up', label: 'Arrow pointing up' },
  { id: 5, x: 58, y: 72, direction: 'right', label: 'Arrow pointing right' },
  { id: 6, x: 84, y: 56, direction: 'up', label: 'Arrow pointing up' },
]

const defaultSettings = {
  sound: true,
  haptics: true,
  hints: true,
  contrast: 80,
}

const state = {
  screen: 'home',
  settings: loadSettings(),
  lives: 3,
  arrows: createArrows(),
  boardMiss: false,
  levelWon: false,
}

function createArrows() {
  return levelLayout.map((arrow) => ({ ...arrow, removed: false, launched: false }))
}

function loadSettings() {
  try {
    const storedSettings = window.localStorage.getItem('arrows-settings')
    if (!storedSettings) {
      return { ...defaultSettings }
    }

    return { ...defaultSettings, ...JSON.parse(storedSettings) }
  } catch {
    return { ...defaultSettings }
  }
}

function saveSettings() {
  window.localStorage.setItem('arrows-settings', JSON.stringify(state.settings))
}

function resetLevel() {
  state.lives = 3
  state.levelWon = false
  state.boardMiss = false
  state.arrows = createArrows()
}

function openScreen(screen) {
  state.screen = screen
  if (screen === 'level') {
    resetLevel()
  }
  render()
}

function renderHomeScreen() {
  return `
    <section class="screen screen-home">
      <div class="hero-card">
        <div class="eyebrow">▲ Arrows</div>
        <h1>Swipe the board clean with perfectly timed taps.</h1>
        <p class="hero-copy">
          A minimal reflex puzzle built for desktop, tablet, and mobile. Clear every arrow,
          keep your three lives, and unlock the flow.
        </p>
        <div class="hero-actions">
          <button class="primary-button" data-screen="level">Play level 1</button>
          <button class="secondary-button" data-screen="settings">Settings</button>
        </div>
      </div>

      <section class="home-grid" aria-label="Game highlights">
        <article class="feature-card feature-card--accent">
          <span class="feature-label">Now live</span>
          <strong>Level 1</strong>
          <p>Animated hints, tactile feedback options, and a clean one-hand-friendly layout.</p>
        </article>
        <article class="feature-card">
          <span class="feature-label">Challenge</span>
          <strong>3 lives</strong>
          <p>Miss the board three times and you restart the round. Hit every arrow to win.</p>
        </article>
        <article class="feature-card">
          <span class="feature-label">Responsive</span>
          <strong>Any screen</strong>
          <p>Fluid cards, roomy controls, and a persistent tab bar for mobile and larger displays.</p>
        </article>
      </section>
    </section>
  `
}

function renderSettingsScreen() {
  return `
    <section class="screen screen-settings">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Settings</p>
          <h2>Tune the feel of the game</h2>
        </div>
        <button class="secondary-button secondary-button--small" data-screen="home">Back home</button>
      </div>

      <section class="settings-list" aria-label="Game settings">
        <label class="setting-item">
          <span>
            <strong>Sound effects</strong>
            <small>Button taps and level completion chimes.</small>
          </span>
          <input type="checkbox" data-setting="sound" ${state.settings.sound ? 'checked' : ''} />
        </label>

        <label class="setting-item">
          <span>
            <strong>Vibration cues</strong>
            <small>Helpful for mobile play when you miss the board.</small>
          </span>
          <input type="checkbox" data-setting="haptics" ${state.settings.haptics ? 'checked' : ''} />
        </label>

        <label class="setting-item">
          <span>
            <strong>Guided hints</strong>
            <small>Shows the animated hand above the next arrow.</small>
          </span>
          <input type="checkbox" data-setting="hints" ${state.settings.hints ? 'checked' : ''} />
        </label>

        <label class="setting-item setting-item--range">
          <span>
            <strong>Board glow</strong>
            <small>Boost or soften the neon contrast of the play area.</small>
          </span>
          <input
            type="range"
            min="40"
            max="100"
            value="${state.settings.contrast}"
            data-setting="contrast"
          />
        </label>
      </section>

      <section class="settings-preview" aria-label="Current setup preview">
        <div class="preview-chip">${state.settings.sound ? 'Sound on' : 'Sound off'}</div>
        <div class="preview-chip">${state.settings.haptics ? 'Vibration on' : 'Vibration off'}</div>
        <div class="preview-chip">${state.settings.hints ? 'Hints on' : 'Hints off'}</div>
        <div class="preview-chip">Glow ${state.settings.contrast}%</div>
      </section>
    </section>
  `
}

function renderArrow(arrow, isHintTarget) {
  const hiddenClass = arrow.removed ? ' level-arrow--hidden' : ''
  const launchedClass = arrow.launched ? ` is-launching is-${arrow.direction}` : ''
  const handMarkup =
    state.settings.hints && isHintTarget && !arrow.launched
      ? '<span class="hint-hand" aria-hidden="true">👆</span>'
      : ''

  return `
    <button
      class="level-arrow level-arrow--${arrow.direction}${hiddenClass}${launchedClass}"
      style="left:${arrow.x}%; top:${arrow.y}%;"
      data-arrow-id="${arrow.id}"
      aria-label="${arrow.label}"
      ${arrow.removed ? 'disabled' : ''}
    >
      ${handMarkup}
      <span class="arrow-core" aria-hidden="true"></span>
    </button>
  `
}

function renderLevelScreen() {
  const arrowsLeft = state.arrows.filter((arrow) => !arrow.removed)
  const nextArrowId = arrowsLeft[0]?.id
  const hearts = Array.from({ length: 3 }, (_, index) =>
    `<span class="life ${index < state.lives ? 'life--active' : ''}" aria-hidden="true">♥</span>`,
  ).join('')

  return `
    <section class="screen screen-level">
      <div class="level-topbar">
        <button class="secondary-button secondary-button--small" data-screen="home">Home</button>
        <div class="status-pill">Level 1</div>
      </div>

      <div class="level-headline">
        <div>
          <p class="eyebrow">Clear the board</p>
          <h2>Tap every arrow before your lives run out.</h2>
        </div>
        <div class="status-panel" aria-label="Level status">
          <div>
            <small>Arrows left</small>
            <strong>${arrowsLeft.length}</strong>
          </div>
          <div>
            <small>Lives</small>
            <strong class="lives">${hearts}</strong>
          </div>
        </div>
      </div>

      <button
        class="board${state.boardMiss ? ' board--missed' : ''}"
        data-board
        style="--board-glow:${state.settings.contrast}%;"
        aria-label="Level 1 game board"
      >
        <span class="board-grid" aria-hidden="true"></span>
        ${state.arrows.map((arrow) => renderArrow(arrow, arrow.id === nextArrowId)).join('')}
        ${
          state.levelWon
            ? `
              <div class="level-overlay">
                <p class="eyebrow">Success</p>
                <h3>Level complete</h3>
                <p>You cleared every arrow with ${state.lives} life${state.lives === 1 ? '' : 's'} remaining.</p>
                <div class="overlay-actions">
                  <button class="primary-button" data-replay>Play again</button>
                  <button class="secondary-button" data-screen="home">Back home</button>
                </div>
              </div>
            `
            : ''
        }
        ${
          state.lives === 0 && !state.levelWon
            ? `
              <div class="level-overlay">
                <p class="eyebrow">Try again</p>
                <h3>Out of lives</h3>
                <p>Missed taps cost a heart. Reset the level and clear the board in one clean run.</p>
                <div class="overlay-actions">
                  <button class="primary-button" data-replay>Retry level</button>
                  <button class="secondary-button" data-screen="settings">Adjust settings</button>
                </div>
              </div>
            `
            : ''
        }
      </button>
    </section>
  `
}

function renderNavigation() {
  return `
    <nav class="tab-bar" aria-label="Primary navigation">
      <button class="tab-link ${state.screen === 'home' ? 'tab-link--active' : ''}" data-screen="home">
        <span aria-hidden="true">⌂</span>
        <span>Home</span>
      </button>
      <button class="tab-link tab-link--locked" disabled>
        <span aria-hidden="true">🔒</span>
        <span>Level 10</span>
      </button>
      <button class="tab-link tab-link--locked" disabled>
        <span aria-hidden="true">🔒</span>
        <span>Level 20</span>
      </button>
      <button class="tab-link ${state.screen === 'settings' ? 'tab-link--active' : ''}" data-screen="settings">
        <span aria-hidden="true">⚙</span>
        <span>Settings</span>
      </button>
    </nav>
  `
}

function render() {
  const screenMarkup =
    state.screen === 'settings'
      ? renderSettingsScreen()
      : state.screen === 'level'
        ? renderLevelScreen()
        : renderHomeScreen()

  app.innerHTML = `
    <div class="app-shell">
      ${screenMarkup}
      ${renderNavigation()}
    </div>
  `
}

function triggerMissFeedback() {
  state.boardMiss = true
  if (state.settings.haptics && navigator.vibrate) {
    navigator.vibrate(120)
  }
  render()
  window.setTimeout(() => {
    state.boardMiss = false
    render()
  }, 280)
}

function handleArrowPress(button) {
  if (state.levelWon || state.lives === 0) {
    return
  }

  const arrowId = Number(button.dataset.arrowId)
  const arrow = state.arrows.find((item) => item.id === arrowId)

  if (!arrow || arrow.removed || arrow.launched) {
    return
  }

  arrow.launched = true
  button.classList.add('is-launching', `is-${arrow.direction}`)
  button.setAttribute('disabled', 'true')

  window.setTimeout(() => {
    arrow.removed = true
    arrow.launched = false
    state.levelWon = state.arrows.every((item) => item.removed)
    render()
  }, 620)
}

app.addEventListener('click', (event) => {
  const screenButton = event.target.closest('[data-screen]')
  if (screenButton) {
    openScreen(screenButton.dataset.screen)
    return
  }

  const replayButton = event.target.closest('[data-replay]')
  if (replayButton) {
    resetLevel()
    render()
    return
  }

  const arrowButton = event.target.closest('[data-arrow-id]')
  if (arrowButton) {
    event.preventDefault()
    event.stopPropagation()
    handleArrowPress(arrowButton)
    return
  }

  const board = event.target.closest('[data-board]')
  if (board && state.lives > 0 && !state.levelWon) {
    state.lives -= 1
    triggerMissFeedback()
  }
})

app.addEventListener('change', (event) => {
  const settingInput = event.target.closest('[data-setting]')
  if (!settingInput) {
    return
  }

  const { setting } = settingInput.dataset
  state.settings[setting] =
    settingInput.type === 'checkbox' ? settingInput.checked : Number(settingInput.value)
  saveSettings()
  render()
})

render()
