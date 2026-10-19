import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AnnouncerProvider } from '../../lib'
import { CoinCatch } from './CoinCatch'

/**
 * Component tests for the celebration.
 *
 * The animation itself is not something a jsdom test can see, and pretending
 * otherwise would be theatre. What these lock down is the part that *is*
 * testable and the part that would actually break:
 *
 *   1. Clearing a level reaches the celebration state at all.
 *   2. The decorative motion is removed under reduced motion.
 *   3. The confirmation text survives reduced motion — the celebration degrades
 *      to words rather than disappearing.
 *   4. An overshoot never celebrates, because nothing was paid.
 */
function setup({ reduceMotion = false }: { reduceMotion?: boolean } = {}) {
  const onExit = vi.fn()
  const onAward = vi.fn()
  const playSound = vi.fn()

  render(
    <AnnouncerProvider>
      <CoinCatch
        onExit={onExit}
        onAward={onAward}
        playSound={playSound}
        reduceMotion={reduceMotion}
      />
    </AnnouncerProvider>,
  )

  return { onExit, onAward, playSound }
}

/** Round one is a 10¢ marble, so a single dime clears it. */
const theDime = () => screen.getByRole('button', { name: /Add 10 cents/i })
const theQuarter = () => screen.getByRole('button', { name: /Add 25 cents/i })

const burst = () => document.querySelector('.coin-burst')
const stamp = () => document.querySelector('.stamp')

describe('clearing a level', () => {
  it('shows the paid stamp', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: true })

    expect(stamp()).toBeNull()
    await user.click(theDime())

    expect(stamp()).not.toBeNull()
    expect(stamp()).toHaveTextContent(/paid/i)
  })

  it('bursts coins when motion is allowed', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: false })

    expect(burst()).toBeNull()
    await user.click(theDime())

    expect(burst()).not.toBeNull()
    expect(burst()?.querySelectorAll('.coin-burst__piece').length).toBeGreaterThan(10)
  })

  it('marks the total and the leftover cell for their accent animations', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: true })

    await user.click(theDime())

    expect(document.querySelector('.tally__value.pop')).not.toBeNull()
    expect(document.querySelector('.tally__cell--goal.flash-mint')).not.toBeNull()
  })

  it('plays the success sound once', async () => {
    const user = userEvent.setup()
    const { playSound } = setup({ reduceMotion: true })

    await user.click(theDime())

    expect(playSound).toHaveBeenCalledWith('correct')
  })
})

describe('reduced motion', () => {
  it('removes the burst but keeps the stamp and the words', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: true })

    await user.click(theDime())

    // The motion is gone…
    expect(burst()).toBeNull()
    // …the confirmation is not. Paying a 10¢ price with one dime is the optimal
    // answer, so the banner takes its "Perfect" branch rather than the plain one.
    expect(stamp()).not.toBeNull()
    expect(document.querySelector('.feedback')).toHaveTextContent(/perfect/i)
    expect(document.querySelector('.feedback')).toHaveTextContent(/\$0\.10/)
  })

  it('still announces the result, which is the real accessibility contract', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: true })

    await user.click(theDime())

    expect(screen.getByTestId('live-polite')).toHaveTextContent(/exactly \$0\.10/i)
  })
})

describe('refusing an overshoot', () => {
  it('does not celebrate when the coin is too big', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: false })

    await user.click(theQuarter()) // 25¢ against a 10¢ price

    expect(stamp()).toBeNull()
    expect(burst()).toBeNull()
    // And it says why, with priority, rather than silently doing nothing.
    expect(screen.getByTestId('live-assertive')).toHaveTextContent(/\$0\.15 too much/i)
  })

  it('lets the child pay correctly straight afterwards', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: true })

    await user.click(theQuarter())
    await user.click(theDime())

    expect(stamp()).not.toBeNull()
  })
})

describe('the level counter', () => {
  it('counts only levels paid with the fewest coins', async () => {
    const user = userEvent.setup()
    setup({ reduceMotion: true })

    expect(screen.getByText(/Fewest coins so far: 0 of 0/i)).toBeInTheDocument()

    await user.click(theDime())

    expect(screen.getByText(/Fewest coins so far: 1 of 1/i)).toBeInTheDocument()
  })
})
