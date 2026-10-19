import type { ReactNode } from 'react'

import { CoinIcon } from '../components/Coins'
import { Illustration } from '../components/Illustration'
import { Penny } from '../components/Penny'
import { Stars } from '../components/Stars'
import type { GameId } from '../lib'

type GameCard = {
  id: GameId
  title: string
  blurb: string
  accent: 'coral' | 'mint' | 'grape'
  art: ReactNode
  /** Save Up! is a calculator, so it shows a badge instead of a star rating. */
  scored: boolean
}

const GAME_CARDS: readonly GameCard[] = [
  {
    id: 'coins',
    title: 'Coin Catch',
    blurb: 'Pay for things at the school fair with exactly the right coins.',
    accent: 'coral',
    art: (
      <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
        <CoinIcon value={25} />
        <CoinIcon value={10} />
      </span>
    ),
    scored: true,
  },
  {
    id: 'sort',
    title: 'Need or Want?',
    blurb: 'Sort things into needs and wants — then talk about why.',
    accent: 'mint',
    art: (
      <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
        <Illustration name="heart" style={{ width: 40 }} />
        <Illustration name="star" style={{ width: 40 }} />
      </span>
    ),
    scored: true,
  },
  {
    id: 'goal',
    title: 'Save Up!',
    blurb: 'Work out how many weeks it takes to save for something big.',
    accent: 'grape',
    art: <Illustration name="jar" style={{ width: 64 }} />,
    scored: false,
  },
]

const OBJECTIVES = [
  'Counting coins and making exact change',
  'Choosing the fewest coins for an amount',
  'Telling a need apart from a want',
  'Turning a savings goal into a weekly plan',
  'Knowing what "saving a bit more" is worth',
  'Talking about money with a grown-up',
]

type HomeProps = {
  stars: Partial<Record<GameId, number>>
  onPlay: (game: GameId) => void
  onOpenGrownUps: () => void
}

export function Home({ stars, onPlay, onOpenGrownUps }: HomeProps) {
  return (
    <div className="screen">
      <section className="hero">
        <Penny mood="idle" className="hero__mascot" />
        <div className="hero__copy">
          <p className="bubble">Hello! I am Penny. Shall we find out how money works?</p>
          <h1 className="hero__title">Money Meadow</h1>
          <p className="hero__lede">
            Two little games and one calculator about money. Tap something to start — nothing you
            do here is sent anywhere.
          </p>
        </div>
      </section>

      <ul className="game-grid">
        {GAME_CARDS.map((card) => {
          const earned = stars[card.id]
          const blurbId = `card-blurb-${card.id}`

          return (
            <li key={card.id}>
              <button
                type="button"
                className="game-card"
                data-accent={card.accent}
                onClick={() => onPlay(card.id)}
                aria-describedby={blurbId}
              >
                <span className="game-card__art">{card.art}</span>
                <span className="game-card__title">{card.title}</span>
                <span className="game-card__blurb" id={blurbId}>
                  {card.blurb}
                </span>
                <span className="game-card__foot">
                  {card.scored ? (
                    <Stars count={earned ?? 0} label={card.title} />
                  ) : (
                    <span className="screen-head__meta">Calculator — no score</span>
                  )}
                  <span className="game-card__cta" aria-hidden="true">
                    Play →
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <section className="sticker objectives" aria-labelledby="objectives-heading">
        <h2 className="objectives__title" id="objectives-heading">
          What these practise
        </h2>
        <ul className="objectives__list">
          {OBJECTIVES.map((objective) => (
            <li className="objectives__item" key={objective}>
              <span className="objectives__tick" aria-hidden="true">
                ✓
              </span>
              <span>{objective}</span>
            </li>
          ))}
        </ul>
        <p className="explanation__body">
          Grown-ups: there is a plain-English summary of what this app stores (almost nothing) and
          how it handles accessibility behind the{' '}
          <button type="button" className="btn btn--inline" onClick={onOpenGrownUps}>
            For grown-ups
          </button>{' '}
          button.
        </p>
      </section>
    </div>
  )
}
