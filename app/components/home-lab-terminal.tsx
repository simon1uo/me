'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Braces,
  Code2,
  Coffee,
  Component,
  Flame,
  Layers,
  Leaf,
  MonitorCog,
  Palette,
  Rocket,
  Server,
  Sparkles,
  Wrench,
} from 'lucide-react'

type TerminalLine = {
  text?: string
  segments?: TerminalSegment[]
  tone?: 'default' | 'accent' | 'muted' | 'success' | 'warning'
  prefix?: string
}

type TerminalSegment = {
  text: string
  icon?: LucideIcon
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

const minSceneDurationMs = 10000
const maxSceneDurationMs = 12000
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

const keywordIconMap: Array<{ key: string; icon: LucideIcon }> = [
  { key: 'typescript', icon: Braces },
  { key: 'javascript', icon: Code2 },
  { key: 'react', icon: Component },
  { key: 'vueuse', icon: Sparkles },
  { key: 'vue', icon: Leaf },
  { key: 'node.js', icon: Server },
  { key: 'java', icon: Coffee },
  { key: 'spring boot', icon: Flame },
  { key: 'vite', icon: Rocket },
  { key: 'tailwind css', icon: Palette },
  { key: 'ai agent tooling', icon: Bot },
  { key: 'tooling', icon: Wrench },
  { key: 'workflow', icon: MonitorCog },
]

const fallbackKeywordIcon = Layers

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

function iconForKeyword(keyword: string) {
  const normalizedKeyword = keyword.toLowerCase().trim()
  const matched = keywordIconMap.find(({ key }) =>
    normalizedKeyword.includes(key)
  )

  return matched?.icon || fallbackKeywordIcon
}

function buildKeywordSegments(items: string[]) {
  return items.flatMap((item, index) => {
    const entry: TerminalSegment[] = [
      {
        text: item,
        icon: iconForKeyword(item),
      },
    ]

    if (index < items.length - 1) {
      entry.push({ text: ', ' })
    }

    return entry
  })
}

function estimateSceneDuration(scene: TerminalScene) {
  const commandChars = scene.command.length
  const outputChars = scene.outputs.reduce(
    (total, line) =>
      total +
      (line.text?.length || 0) +
      (line.prefix?.length || 0) +
      (line.segments?.reduce(
        (segmentTotal, segment) => segmentTotal + segment.text.length,
        0
      ) || 0),
    0
  )
  const outputLines = scene.outputs.length
  const avgTypingDelay = (typingStepDelayMinMs + typingStepDelayMaxMs) / 2
  const typingBudget = commandChars * avgTypingDelay
  const loadingBudget =
    submitPauseMs + (loadingPhaseMinMs + loadingPhaseMaxMs) / 2
  const revealBudget = outputLines * (outputStepDelayMs + outputStepJitterMs / 2)
  const readingBudget = outputChars * 10 + outputLines * 600

  const rawDuration =
    typingStartDelayMs + typingBudget + loadingBudget + revealBudget + readingBudget

  return Math.max(minSceneDurationMs, Math.min(maxSceneDurationMs, rawDuration))
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
          segments: [
            { text: 'frontend => ' },
            ...buildKeywordSegments(frontendItems || []),
          ],
          tone: 'accent',
        },
        {
          segments: [
            { text: 'backend  => ' },
            ...buildKeywordSegments(backendItems || []),
          ],
          tone: 'default',
        },
        {
          segments: [
            { text: 'ops      => ' },
            ...buildKeywordSegments(workflowItems || []),
          ],
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
          segments: [{ text: item, icon: iconForKeyword(item) }],
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
  const currentSceneDuration = useMemo(
    () => estimateSceneDuration(currentScene),
    [currentScene]
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSceneIndex((current) => (current + 1) % scenes.length)
    }, currentSceneDuration)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentSceneDuration, prefersReducedMotion, sceneIndex, scenes.length])

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
          key={`${scene.label}-${index}-${
            line.text ||
            line.segments?.map((segment) => segment.text).join('') ||
            'line'
          }`}
          className={`${lineToneClass(line.tone)} atlas-terminal-line`}
        >
          <span className="text-[var(--atlas-terminal-accent-soft)]">
            {line.prefix || ''}
          </span>
          {line.segments?.length ? (
            <span className="inline-flex flex-wrap items-center gap-x-1">
              {line.segments.map((segment, segmentIndex) => {
                const SegmentIcon = segment.icon
                return (
                  <span
                    key={`${scene.label}-${index}-${segmentIndex}-${segment.text}`}
                    className="inline-flex items-center gap-1"
                  >
                    {SegmentIcon ? (
                      <SegmentIcon
                        aria-hidden="true"
                        className="h-3.5 w-3.5 text-[var(--atlas-terminal-accent-soft)]"
                        strokeWidth={1.75}
                      />
                    ) : null}
                    <span>{segment.text}</span>
                  </span>
                )
              })}
            </span>
          ) : (
            line.text
          )}
        </p>
      ))}
    </div>
  )
}
