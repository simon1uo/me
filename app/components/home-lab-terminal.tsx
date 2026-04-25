'use client'

import { useEffect, useMemo, useState } from 'react'

type TerminalLine = {
  text: string
  tone?: 'default' | 'accent' | 'muted' | 'success' | 'warning'
  prefix?: string
}

type TerminalScene = {
  label: string
  command: string
  outputs: TerminalLine[]
  footer: string
}

type HomeLabTerminalProps = {
  name: string
  roleLine: string
  location: string
  emails: {
    primary: string
    secondary?: string
  }
  stackGroups: Array<{
    title: string
    items: string[]
  }>
  notes: string[]
  stackSnapshot: string[]
}

const sceneDurationMs = 6200
const typingStartDelayMs = 420
const typingStepDelayMinMs = 28
const typingStepDelayMaxMs = 88
const submitPauseMs = 420
const outputStepDelayMs = 380
const outputStepJitterMs = 150
const loadingPhaseMinMs = 900
const loadingPhaseMaxMs = 2000
const spinnerFrameDelayMinMs = 170
const spinnerFrameDelayMaxMs = 300
const spinnerFrames = ['✶', '✸', '✹', '✺']

const loadingWordBank = [
  'Accomplishing',
  'Actioning',
  'Actualizing',
  'Architecting',
  'Baking',
  'Beaming',
  "Beboppin'",
  'Befuddling',
  'Billowing',
  'Blanching',
  'Bloviating',
  'Boogieing',
  'Boondoggling',
  'Booping',
  'Bootstrapping',
  'Brewing',
  'Burrowing',
  'Calculating',
  'Canoodling',
  'Caramelizing',
  'Cascading',
  'Catapulting',
  'Cerebrating',
  'Channelling',
  'Choreographing',
  'Churning',
  'Clauding',
  'Coalescing',
  'Cogitating',
  'Combobulating',
  'Composing',
  'Computing',
  'Concocting',
  'Considering',
  'Contemplating',
  'Cooking',
  'Crafting',
  'Creating',
  'Crystallizing',
  'Cultivating',
  'Crunching',
  'Deciphering',
  'Deliberating',
  'Determining',
  'Dilly-dallying',
  'Discombobulating',
  'Doing',
  'Doodling',
  'Drizzling',
  'Ebbing',
  'Effecting',
  'Elucidating',
  'Embellishing',
  'Enchanting',
  'Envisioning',
  'Evaporating',
  'Fermenting',
  'Fiddle-faddling',
  'Finagling',
  'Flambéing',
  'Flibbertigibbeting',
  'Flowing',
  'Flummoxing',
  'Fluttering',
  'Forging',
  'Forming',
  'Frosting',
  'Frolicking',
  'Gallivanting',
  'Galloping',
  'Garnishing',
  'Generating',
  'Germinating',
  'Gitifying',
  'Grooving',
  'Gusting',
  'Harmonizing',
  'Hashing',
  'Hatching',
  'Herding',
  'Hibernating',
  'Honking',
  'Hullaballooing',
  'Hyperspacing',
  'Ideating',
  'Imagining',
  'Improvising',
  'Incubating',
  'Inferring',
  'Infusing',
  'Ionizing',
  'Jitterbugging',
  'Julienning',
  'Kneading',
  'Leavening',
  'Levitating',
  'Lollygagging',
  'Manifesting',
  'Marinating',
  'Meandering',
  'Metamorphosing',
  'Misting',
  'Moonwalking',
  'Moseying',
  'Mulling',
  'Mustering',
  'Musing',
  'Nebulizing',
  'Nesting',
  'Noodling',
  'Nucleating',
  'Orbiting',
  'Orchestrating',
  'Osmosing',
  'Perambulating',
  'Percolating',
  'Perusing',
  'Philosophising',
  'Photosynthesizing',
  'Pollinating',
  'Pontificating',
  'Pondering',
  'Pouncing',
  'Precipitating',
  'Prestidigitating',
  'Processing',
  'Proofing',
  'Propagating',
  'Puttering',
  'Puzzling',
  'Quantumizing',
  'Razzle-dazzling',
  'Razzmatazzing',
  'Recombobulating',
  'Reticulating',
  'Roosting',
  'Ruminating',
  'Sautéing',
  'Scampering',
  'Scheming',
  'Schlepping',
  'Scurrying',
  'Seasoning',
  'Shenaniganing',
  'Shimmying',
  'Simmering',
  'Skedaddling',
  'Sketching',
  'Slithering',
  'Smooshing',
  'Sock-hopping',
  'Spelunking',
  'Spinning',
  'Sprouting',
  'Stewing',
  'Sublimating',
  'Sussing',
  'Swirling',
  'Swooping',
  'Symbioting',
  'Synthesizing',
  'Tempering',
  'Thinking',
  'Thundering',
  'Tinkering',
  'Tomfoolering',
  'Topsy-turvying',
  'Transfiguring',
  'Transmuting',
  'Twisting',
  'Undulating',
  'Unfurling',
  'Unravelling',
  'Vibing',
  'Waddling',
  'Wandering',
  'Warping',
  'Whatchamacalliting',
  'Whirlpooling',
  'Whirring',
  'Whisking',
  'Wibbling',
  'Working',
  'Wrangling',
  'Zesting',
  'Zigzagging',
]

function randomBetween(min: number, max: number) {
  const lower = Math.ceil(Math.min(min, max))
  const upper = Math.floor(Math.max(min, max))
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

function pickRandomWord(source: string[]) {
  return source[randomBetween(0, source.length - 1)]
}

function typingDelayForChar(char: string) {
  if (char === ' ') {
    return randomBetween(typingStepDelayMinMs - 6, typingStepDelayMaxMs - 12)
  }

  if (['/', '-', '.', '=', '&'].includes(char)) {
    return randomBetween(typingStepDelayMinMs + 18, typingStepDelayMaxMs + 40)
  }

  return randomBetween(typingStepDelayMinMs, typingStepDelayMaxMs)
}

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)

    return () => {
      mediaQuery.removeEventListener('change', updatePreference)
    }
  }, [])

  return prefersReducedMotion
}

function buildScenes({
  name,
  roleLine,
  location,
  emails,
  stackGroups,
  notes,
  stackSnapshot,
}: HomeLabTerminalProps): TerminalScene[] {
  const workflowItems = stackGroups.find(
    (group) => group.title === 'Tooling / Workflow'
  )?.items
  const frontendItems = stackGroups.find(
    (group) => group.title === 'Frontend Systems'
  )?.items
  const backendItems = stackGroups.find(
    (group) => group.title === 'Backend / Infra'
  )?.items

  return [
    {
      label: 'bootstrap',
      command: './boot --profile atlas --mode lab',
      outputs: [
        { text: '[ok] shell kernel online', tone: 'success' },
        { text: '[====] loading operator manifest', tone: 'accent' },
        { text: `${name} :: ${roleLine}`, tone: 'default' },
      ],
      footer: 'session::bootstrapped',
    },
    {
      label: 'identity',
      command: 'cat ~/.config/lab/operator.yml',
      outputs: [
        { text: `name: ${name}`, tone: 'default' },
        { text: `role: ${roleLine}`, tone: 'default' },
        { text: `base: ${location}`, tone: 'muted' },
        { text: `contact: ${emails.primary}`, tone: 'muted' },
        ...(emails.secondary
          ? [{ text: `backup: ${emails.secondary}`, tone: 'muted' as const }]
          : []),
      ],
      footer: 'profile::mounted',
    },
    {
      label: 'stack',
      command: 'pnpm dlx envinfo --system --binaries --browsers',
      outputs: [
        {
          text: `frontend => ${(frontendItems || []).join(', ')}`,
          tone: 'accent',
        },
        {
          text: `backend  => ${(backendItems || []).join(', ')}`,
          tone: 'default',
        },
        {
          text: `ops      => ${(workflowItems || []).join(', ')}`,
          tone: 'muted',
        },
      ],
      footer: 'stack::indexed',
    },
    {
      label: 'workflow',
      command: 'git status --short && ./ops/checklist --today',
      outputs: [
        { text: 'M app/page.tsx', tone: 'warning' },
        { text: '[ok] lint -> build -> ship', tone: 'success' },
        { text: '[ok] delivery discipline enforced', tone: 'success' },
      ],
      footer: 'workflow::armed',
    },
    {
      label: 'toolchain',
      command: 'ls ~/toolchain --group-directories-first',
      outputs: (stackSnapshot.length
        ? stackSnapshot
        : ['Next.js + TypeScript']
      )
        .slice(0, 3)
        .map((item) => ({
          text: item,
          prefix: '- ',
          tone: 'default' as const,
        })),
      footer: 'toolchain::available',
    },
    {
      label: 'notes',
      command: 'tail -n 3 ~/logs/current-focus.log',
      outputs: notes.slice(0, 2).map((note) => ({
        text: note,
        prefix: '> ',
        tone: 'muted' as const,
      })),
      footer: 'focus::streaming',
    },
  ]
}

function lineToneClass(tone: TerminalLine['tone']) {
  switch (tone) {
    case 'accent':
      return 'text-[var(--atlas-terminal-accent-soft)]'
    case 'muted':
      return 'text-[var(--atlas-terminal-muted)]'
    case 'success':
      return 'text-[var(--atlas-terminal-success)]'
    case 'warning':
      return 'text-[var(--atlas-terminal-warning)]'
    default:
      return 'text-[var(--atlas-terminal-text)]'
  }
}

export function HomeLabTerminal(props: HomeLabTerminalProps) {
  const scenes = useMemo(() => buildScenes(props), [props])
  const prefersReducedMotion = useReducedMotionPreference()
  const [sceneIndex, setSceneIndex] = useState(0)

  const currentScene = scenes[sceneIndex]

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSceneIndex((current) => (current + 1) % scenes.length)
    }, sceneDurationMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [prefersReducedMotion, sceneIndex, scenes.length])

  return (
    <section className="atlas-lab-shell atlas-panel relative overflow-hidden">
      <div className="atlas-lab-noise" aria-hidden="true" />
      <div className="atlas-lab-scanline" aria-hidden="true" />

      <div className="p-5 sm:p-6 lg:p-8">
        <div className="atlas-terminal-window">
          <div className="border-b border-[var(--atlas-terminal-border)]">
            <div className="flex items-center px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="atlas-lab-led atlas-lab-led-danger" />
                <span className="atlas-lab-led atlas-lab-led-warn" />
                <span className="atlas-lab-led atlas-lab-led-live" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[var(--atlas-terminal-border)] px-4 py-3 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--atlas-terminal-muted)] sm:px-5 sm:text-[0.66rem]">
              <span>~/workspace/simon-lab</span>
              <span>{currentScene.label}</span>
            </div>
          </div>
          <div className="atlas-terminal-viewport">
            <TerminalPlayback
              key={currentScene.label}
              scene={currentScene}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function TerminalPlayback({
  scene,
  prefersReducedMotion,
}: {
  scene: TerminalScene
  prefersReducedMotion: boolean
}) {
  const [typedLength, setTypedLength] = useState(0)
  const [showOutputs, setShowOutputs] = useState(0)
  const [loadingWord, setLoadingWord] = useState('')
  const [spinnerFrameIndex, setSpinnerFrameIndex] = useState(0)

  const visibleCommand = prefersReducedMotion
    ? scene.command
    : scene.command.slice(0, typedLength)
  const visibleOutputs = prefersReducedMotion
    ? scene.outputs
    : scene.outputs.slice(0, showOutputs)
  const shouldShowLoading = Boolean(loadingWord)
  const spinnerGlyph = spinnerFrames[spinnerFrameIndex % spinnerFrames.length]

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    let cancelled = false
    const timeoutIds: number[] = []

    const schedule = (callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(() => {
        if (!cancelled) {
          callback()
        }
      }, delay)

      timeoutIds.push(timeoutId)
    }

    const revealOutputs = (index: number) => {
      if (index >= scene.outputs.length) {
        setLoadingWord('')
        return
      }

      setShowOutputs(index + 1)
      schedule(
        () => revealOutputs(index + 1),
        outputStepDelayMs + randomBetween(0, outputStepJitterMs)
      )
    }

    const runLoadingPhase = () => {
      const phaseDuration = randomBetween(loadingPhaseMinMs, loadingPhaseMaxMs)
      const phaseStartedAt = Date.now()
      const selectedWord = pickRandomWord(loadingWordBank)

      setLoadingWord(selectedWord)
      setSpinnerFrameIndex(0)

      const spin = () => {
        const elapsed = Date.now() - phaseStartedAt
        if (elapsed >= phaseDuration) {
          setLoadingWord('')
          revealOutputs(0)
          return
        }

        setSpinnerFrameIndex((current) => (current + 1) % spinnerFrames.length)
        schedule(
          spin,
          randomBetween(spinnerFrameDelayMinMs, spinnerFrameDelayMaxMs)
        )
      }

      schedule(spin, randomBetween(spinnerFrameDelayMinMs, spinnerFrameDelayMaxMs))
    }

    const typeCommand = (index: number) => {
      if (index >= scene.command.length) {
        schedule(runLoadingPhase, submitPauseMs)
        return
      }

      setTypedLength(index + 1)
      schedule(
        () => typeCommand(index + 1),
        typingDelayForChar(scene.command[index])
      )
    }

    schedule(() => typeCommand(0), typingStartDelayMs)

    return () => {
      cancelled = true
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [prefersReducedMotion, scene])

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-start space-y-3 px-4 py-5 font-mono text-[0.84rem] leading-6 text-[var(--atlas-terminal-text)] sm:px-5 sm:text-[0.88rem]">
      <div className="flex flex-wrap items-center gap-x-1.5">
        <span className="text-[var(--atlas-terminal-accent-soft)]">
          simon@lab
        </span>
        <span className="text-[var(--atlas-terminal-muted)]">~/workspace</span>
        <span className="text-[var(--atlas-terminal-success)]">$</span>
        <span>{visibleCommand}</span>
        <span className="atlas-terminal-caret" aria-hidden="true" />
      </div>

      {shouldShowLoading && (
        <p className="atlas-terminal-loader text-[var(--atlas-terminal-muted)]">
          <span className="atlas-terminal-spinner text-[var(--atlas-terminal-accent-soft)]">
            {spinnerGlyph}
          </span>{' '}
          {loadingWord}
        </p>
      )}

      {visibleOutputs.map((line, index) => (
        <p
          key={`${scene.label}-${index}-${line.text}`}
          className={`${lineToneClass(line.tone)} atlas-terminal-line`}
        >
          <span className="text-[var(--atlas-terminal-accent-soft)]">
            {line.prefix || ''}
          </span>
          {line.text}
        </p>
      ))}
    </div>
  )
}
