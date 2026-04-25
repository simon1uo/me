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
  email: string
  stackGroups: Array<{
    title: string
    items: string[]
  }>
  notes: string[]
  stackSnapshot: string[]
}

const sceneDurationMs = 6200
const typingStartDelayMs = 420
const typingStepDelayMs = 58
const submitPauseMs = 420
const outputStepDelayMs = 380

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
  email,
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
        { text: `contact: ${email}`, tone: 'muted' },
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

  const visibleCommand = prefersReducedMotion
    ? scene.command
    : scene.command.slice(0, typedLength)
  const visibleOutputs = prefersReducedMotion
    ? scene.outputs
    : scene.outputs.slice(0, showOutputs)

  useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    let timeoutId: number

    const typeCommand = () => {
      setTypedLength((current) => {
        if (current < scene.command.length) {
          timeoutId = window.setTimeout(typeCommand, typingStepDelayMs)
          return current + 1
        }

        timeoutId = window.setTimeout(() => {
          revealOutputs(0)
        }, submitPauseMs)

        return current
      })
    }

    const revealOutputs = (index: number) => {
      if (index >= scene.outputs.length) {
        return
      }

      setShowOutputs(index + 1)
      timeoutId = window.setTimeout(() => revealOutputs(index + 1), outputStepDelayMs)
    }

    timeoutId = window.setTimeout(typeCommand, typingStartDelayMs)

    return () => {
      window.clearTimeout(timeoutId)
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
