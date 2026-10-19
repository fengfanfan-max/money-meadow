import { useEffect, useId, useRef, useState } from 'react'

import { IconLock, IconSparkle, IconTick } from './Icons'
import type { Settings } from '../lib'

type GrownUpsProps = {
  open: boolean
  onClose: () => void
  settings: Settings
  systemReduceMotion: boolean
  onUpdateSettings: (patch: Partial<Settings>) => void
  onEraseEverything: () => void
}

/**
 * The grown-ups panel.
 *
 * Built on the native `<dialog>` element with `showModal()`. That is not a
 * shortcut — it is the correct choice, because the platform then supplies focus
 * trapping, focus restoration on close, Escape-to-dismiss and an inert
 * background, all of which are easy to get subtly wrong by hand and all of which
 * are exactly the things that break for keyboard and screen-reader users.
 *
 * The content is the deliverable here. A client brief that names COPPA and
 * accessibility is asking whether the person can talk about them accurately, so
 * this panel states what the app does, what it does not do, and — where a claim
 * would be overreach — says so.
 */
export function GrownUps({
  open,
  onClose,
  settings,
  systemReduceMotion,
  onUpdateSettings,
  onEraseEverything,
}: GrownUpsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmingErase, setConfirmingErase] = useState(false)
  const [erased, setErased] = useState(false)
  const titleId = useId()
  const motionGroupName = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      // jsdom implements <dialog> but not showModal, so tests take the fallback.
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setConfirmingErase(false)
      setErased(false)
    }
  }, [open])

  const handleErase = () => {
    if (!confirmingErase) {
      setConfirmingErase(true)
      return
    }
    onEraseEverything()
    setConfirmingErase(false)
    setErased(true)
  }

  return (
    <dialog
      ref={dialogRef}
      className="grownups"
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="grownups__head">
        <h2 className="grownups__title" id={titleId}>
          For grown-ups
        </h2>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="grownups__body">
        <section className="grownups__section">
          <h3>What this app stores</h3>
          <ul className="fact-list">
            <li>
              <span className="fact-list__mark"><IconSparkle /></span>
              <span>
                Three star ratings, one per game, and two on/off preferences. That is the entire
                list.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                It is kept in this browser on this device, under a single{' '}
                <code>localStorage</code> key. Clearing the browser data clears it.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconLock /></span>
              <span>
                It is never transmitted. After the page has loaded, this app makes no network
                requests at all — the fonts are served from this site, and there is no analytics,
                no error reporting and no third-party script.
              </span>
            </li>
          </ul>
        </section>

        <section className="grownups__section">
          <h3>What it never does</h3>
          <ul className="fact-list">
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                No accounts, no sign-up, and no field for a name, email address, age or anything
                else. There is no free-text input anywhere in the app — the only things a child can
                operate are buttons, sliders and switches.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>No advertising, no ad SDKs, no third-party analytics, no tracking pixels.</span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                No cookies, no fingerprinting, and no reading of anything already stored by other
                sites.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                No camera, microphone, location, contacts or notifications. The app never asks the
                browser for a permission.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                No chat, no social features, no user-generated content and no links off to other
                sites.
              </span>
            </li>
          </ul>
        </section>

        <section className="grownups__section">
          <h3>About COPPA</h3>
          <p>
            COPPA places duties on operators who collect personal information from children under
            13. The design decision in this app is to collect none: there is no account, no
            free-text field, and no transmission of anything, so there is no personal information
            to obtain verifiable parental consent for.
          </p>
          <p>
            That is a design position rather than a legal conclusion, and it is worth being precise
            about where it stops. If this app ever gained accounts, cloud-synced progress,
            analytics or any form of advertising, the compliance work would become real work, and
            it would start with a data map and a retention policy rather than a checkbox.
          </p>
          <p>
            Two smaller habits here are part of the same idea. Sound is <strong>off</strong> by
            default, so a classroom of tablets does not make noise at once. And the only thing the
            app persists is a star rating, so a child who never plays it twice leaves no trace at
            all.
          </p>
        </section>

        <section className="grownups__section">
          <h3>Accessibility</h3>
          <ul className="fact-list">
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                Targets WCAG 2.2 level AA. Every colour pair in the interface is measured by a
                script in the repository against its required ratio, and the check fails if one
                drops below it — so the claim is enforced rather than asserted.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                Fully operable by keyboard and by switch. Focus is always visible, and it is drawn
                in a colour that clears 3:1 against every surface it can land on.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                Every game event that is shown visually is also announced in words — the running
                total, how much is left to pay, and whether an answer was right. Nothing depends on
                animation or on colour to be understood.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                Animation is CSS rather than canvas, so the games stay in the accessibility tree.
                Reduced-motion, increased-contrast and forced-colours preferences are all honoured.
              </span>
            </li>
            <li>
              <span className="fact-list__mark"><IconTick /></span>
              <span>
                Text never falls below 16px, and interactive targets are at least 56px — well above
                the 24px minimum, because these are pressed by children on tablets.
              </span>
            </li>
          </ul>
        </section>

        <section className="grownups__section">
          <h3>Settings</h3>

          <div className="setting-row">
            <span className="setting-row__text">
              {/*
                A real <label for>, not an aria-label and not a wrapping label.

                Three attempts at this, and the third is the one that is both
                correct and quiet in an audit:

                1. The input wrapped in a <label> whose only contents were
                   aria-hidden visuals. The accessible name computed to nothing,
                   so axe reported `label` (critical) on an unlabelled control.
                2. aria-labelledby pointing at the visible text plus
                   aria-describedby for the help. Named correctly, but axe's
                   `title-only` check only counts <label> associations, so it
                   still flagged `label-title-only` (serious).
                3. This: the visible word is the label, associated by id. The
                   switch track is a second label for the same input, so tapping
                   anywhere on the switch still works, and it is aria-hidden so it
                   contributes no name.
              */}
              <label className="setting-row__label" htmlFor="sound-switch">
                Sound
              </label>
              <span className="setting-row__help" id="sound-help">
                Gentle blips, synthesised in the browser. Off unless you turn it on.
              </span>
            </span>
            <span className="switch">
              {/* role="switch" makes it announce as a switch rather than a checkbox,
                  which matches what it looks like. */}
              <input
                id="sound-switch"
                type="checkbox"
                role="switch"
                checked={settings.sound}
                onChange={(event) => onUpdateSettings({ sound: event.target.checked })}
                aria-describedby="sound-help"
              />
              <label className="switch__track" htmlFor="sound-switch" aria-hidden="true">
                <span className="switch__thumb" />
              </label>
              <span className="switch__state" aria-hidden="true">
                {settings.sound ? 'On' : 'Off'}
              </span>
            </span>
          </div>

          <div className="setting-row">
            <span className="setting-row__text">
              <span className="setting-row__label" id="motion-label">
                Movement
              </span>
              <span className="setting-row__help">
                This device currently asks for{' '}
                {systemReduceMotion ? 'reduced movement' : 'full movement'}. You can override it
                here.
              </span>
            </span>
            <fieldset className="segmented" aria-labelledby="motion-label" style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="sr-only">Movement preference</legend>
              {(
                [
                  { value: null, label: 'Device' },
                  { value: true, label: 'Less' },
                  { value: false, label: 'Full' },
                ] as const
              ).map((option) => (
                <label key={option.label}>
                  <input
                    type="radio"
                    name={motionGroupName}
                    checked={settings.reduceMotion === option.value}
                    onChange={() => onUpdateSettings({ reduceMotion: option.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
          </div>

          <div className="setting-row">
            <span className="setting-row__text">
              <span className="setting-row__label">Erase everything</span>
              <span className="setting-row__help">
                Removes the stars and settings from this browser. There is nothing else to remove.
              </span>
            </span>
            <button type="button" className="btn btn--danger" onClick={handleErase}>
              {confirmingErase ? 'Yes, erase it' : 'Erase'}
            </button>
          </div>

          <p role="status" aria-live="polite" className="setting-row__help">
            {erased ? 'Everything stored by this app has been erased from this browser.' : ''}
          </p>
        </section>
      </div>
    </dialog>
  )
}
