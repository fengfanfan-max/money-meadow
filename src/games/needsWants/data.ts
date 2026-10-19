import type { IllustrationName } from '../../components/Illustration'

/**
 * Need or Want? — content.
 *
 * The content is the game. A sorting game with lazy copy teaches a child that
 * ice cream is "bad", which is not the lesson. The lesson is that a need is
 * something that keeps you healthy, safe or able to take part, and a want is
 * everything else — including things that are genuinely lovely.
 *
 * So every `reason` is written to be true whichever way the child answered, and
 * every item carries a `talk` prompt, because the most useful thing this screen
 * can produce is a conversation between a child and a grown-up. That prompt is
 * the reason the game has a grown-ups-facing payoff at all.
 */

export type SortAnswer = 'need' | 'want'

export type SortItem = {
  id: string
  name: string
  art: IllustrationName
  answer: SortAnswer
  /** Shown after the answer, and written to be correct either way. */
  reason: string
  /** A question to ask a grown-up. Shown with the explanation. */
  talk: string
}

export const SORT_ITEMS: readonly SortItem[] = [
  {
    id: 'coat',
    name: 'A warm winter coat',
    art: 'coat',
    answer: 'need',
    reason: 'You need to stay warm. Without a coat, a cold day can make you poorly.',
    talk: 'What would happen if you went outside in winter without a coat?',
  },
  {
    id: 'toothbrush',
    name: 'A toothbrush',
    art: 'toothbrush',
    answer: 'need',
    reason: 'You need it to keep your teeth healthy.',
    talk: 'What else do you do to look after your teeth?',
  },
  {
    id: 'milk',
    name: 'A carton of milk',
    art: 'milk',
    answer: 'need',
    reason: 'Milk is food. Your body needs food and drink every single day.',
    talk: 'What other food does your body need every day?',
  },
  {
    id: 'shoes',
    name: 'A pair of shoes',
    art: 'shoes',
    answer: 'need',
    reason: 'You need shoes to walk outside safely.',
    talk: 'Which shoes do you need, and which ones do you just like?',
  },
  {
    id: 'medicine',
    name: 'Medicine when you are ill',
    art: 'medicine',
    answer: 'need',
    reason: 'When you are ill, medicine helps you get better.',
    talk: 'Who decides when you need medicine?',
  },
  {
    id: 'icecream',
    name: 'An ice cream',
    art: 'icecream',
    answer: 'want',
    reason:
      'Ice cream is a treat. It is lovely, and you do not need it to stay healthy — which is exactly what makes it a treat.',
    talk: 'When is a good time for a treat?',
  },
  {
    id: 'videogame',
    name: 'A new video game',
    art: 'videogame',
    answer: 'want',
    reason: 'Games are fun to play. Fun is good, and fun is still a want.',
    talk: 'How do you decide how long to play for?',
  },
  {
    id: 'teddy',
    name: 'A cuddly teddy',
    art: 'teddy',
    answer: 'want',
    reason: 'You want it because it is cosy to cuddle. Comfort is a want, not a need.',
    talk: 'Which of your things do you love the most? Do you need it?',
  },
  {
    id: 'cinema',
    name: 'A trip to the cinema',
    art: 'cinema',
    answer: 'want',
    reason: 'A fun day out with people you like. Still a want.',
    talk: 'What is the difference between a treat and a need?',
  },
  {
    id: 'sticker',
    name: 'A pack of stickers',
    art: 'sticker',
    answer: 'want',
    reason: 'Nice to have. You do not need stickers to be healthy or safe.',
    talk: 'If you had five dollars, what would you spend it on, and why?',
  },
]

/** Items per play-through. Fewer than the pool, so replays are not identical. */
export const ROUND_SIZE = 8

export const ANSWER_LABELS: Record<SortAnswer, string> = {
  need: 'I need it',
  want: 'I want it',
}

/** The one-line definition each bin teaches. */
export const ANSWER_DEFINITIONS: Record<SortAnswer, string> = {
  need: 'Needs keep you healthy, safe and able to join in.',
  want: 'Wants are nice to have. They make life better, not possible.',
}
