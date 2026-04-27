'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type CopyLocale = 'en' | 'zh'

type TerminalLineKind =
  | 'system'
  | 'task'
  | 'plan'
  | 'tool'
  | 'result'
  | 'check'
  | 'next'

type TerminalLine = {
  kind: TerminalLineKind
  text: string
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
  copyLocale?: CopyLocale
}

type LocaleCopy = {
  promptRequests: string[]
  loadingWords: string[]
  sceneLabels: string[]
  rolePrefix: string
  basedPrefix: string
  focusLead: string
  stackLead: string
  toolchainLead: string
  skillsLead: string
  proofLead: string
  nextLead: string
  footerPrefix: string
  hud: {
    contextLeft: string
    contextUsed: string
    inLabel: string
    outLabel: string
    weeklyLimit: string
  }
}

const minSceneDurationMs = 10000
const maxSceneDurationMs = 24000
const typingStartDelayMs = 420
const typingStepDelayMinMs = 28
const typingStepDelayMaxMs = 88
const submitPauseMs = 420
const clearFramePauseMs = 120
const clearBlankAfterExecuteMs = 120
const outputStepDelayMs = 380
const outputStepJitterMs = 150
const loadingPhaseMinMs = 900
const loadingPhaseMaxMs = 2000
const spinnerFrameDelayMinMs = 170
const spinnerFrameDelayMaxMs = 300
const spinnerFrames = ['✶', '✸', '✹', '✺']

const driverTemplates = ['simondex', 'simonaude'] as const

const copyByLocale: Record<CopyLocale, LocaleCopy> = {
  en: {
    promptRequests: [
      'Help me introduce this person in a concise and friendly way.',
      'Help me summarize what this person has been working on recently.',
      "Help me describe this person's frontend and backend tech stack.",
      "Help me describe this person's toolchain and engineering workflow.",
      "Help me summarize this person's core skills with concrete proof.",
      'Help me summarize how to collaborate with this person effectively.',
    ],
    loadingWords: [
      'Aligning',
      'Composing',
      'Orchestrating',
      'Validating',
      'Sequencing',
      'Synthesizing',
      'Checking',
      'Routing',
    ],
    sceneLabels: [
      'who-i-am',
      'what-i-build',
      'stack-map',
      'toolchain-flow',
      'skills-proof',
      'collab-next',
    ],
    rolePrefix: 'Role',
    basedPrefix: 'Based in',
    focusLead: 'Current focus',
    stackLead: 'Core stack',
    toolchainLead: 'Toolchain',
    skillsLead: 'Skill',
    proofLead: 'Proof',
    nextLead: 'Next loop',
    footerPrefix: 'profile',
    hud: {
      contextLeft: 'Context',
      contextUsed: 'Context',
      inLabel: 'in',
      outLabel: 'out',
      weeklyLimit: 'Weekly limit',
    },
  },
  zh: {
    promptRequests: [
      '帮我用简洁自然的方式介绍这个人。',
      '帮我总结这个人最近在干什么。',
      '帮我描述这个人的前后端技术栈。',
      '帮我描述这个人的工具链和工程流程。',
      '帮我总结这个人的核心技能并给出证据。',
      '帮我总结如何高效地与这个人协作。',
    ],
    loadingWords: ['对齐中', '编排中', '校验中', '整合中', '同步中', '构建中', '检查中', '路由中'],
    sceneLabels: ['个人介绍', '工作重心', '技术栈', '工具链', '技能证明', '协作信息'],
    rolePrefix: '角色',
    basedPrefix: '所在地',
    focusLead: '当前重心',
    stackLead: '核心技术栈',
    toolchainLead: '工具链',
    skillsLead: '技能',
    proofLead: '证据',
    nextLead: '下一轮',
    footerPrefix: '档案',
    hud: {
      contextLeft: '上下文',
      contextUsed: '上下文',
      inLabel: '输入',
      outLabel: '输出',
      weeklyLimit: '周限额',
    },
  },
}

function randomBetween(min: number, max: number) {
  const lower = Math.ceil(Math.min(min, max))
  const upper = Math.floor(Math.max(min, max))
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

function pickBySlot<T>(source: readonly T[], slot: number) {
  if (!source.length) {
    throw new Error('pickBySlot requires a non-empty array')
  }

  return source[((slot % source.length) + source.length) % source.length]
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

function readingHoldForScene(scene: TerminalScene) {
  const outputChars = scene.outputs.reduce((total, line) => total + line.text.length, 0)
  const outputLines = scene.outputs.length
  const hold = outputChars * 14 + outputLines * 760

  return Math.max(3200, Math.min(6200, hold))
}

function formatStack(items: string[]) {
  return items.length ? items.join(' · ') : 'TypeScript · React · Node.js'
}

function findGroupItems(
  stackGroups: HomeLabTerminalProps['stackGroups'],
  keyword: string
) {
  const target = stackGroups.find((group) =>
    group.title.toLowerCase().includes(keyword.toLowerCase())
  )

  return target?.items || []
}

function buildScenes(props: HomeLabTerminalProps, cycle: number): TerminalScene[] {
  const locale = props.copyLocale || 'en'
  const copy = copyByLocale[locale]
  const frontend = findGroupItems(props.stackGroups, 'frontend')
  const backend = findGroupItems(props.stackGroups, 'backend')
  const tooling = findGroupItems(props.stackGroups, 'tooling')

  const focusNote = props.notes[cycle % Math.max(props.notes.length, 1)] ||
    'Building maintainable products with fast feedback loops.'
  const snapshot = props.stackSnapshot.length
    ? props.stackSnapshot
    : ['Vue + React + TypeScript', 'Node.js / Java + Spring Boot', 'Vite + Tailwind + Agent tooling']

  const skillLines = [
    {
      skill: snapshot[0] || 'Frontend systems',
      proof: props.notes[0] || 'Shipped production-ready UI systems with clear structure.',
    },
    {
      skill: snapshot[1] || 'Backend delivery',
      proof: props.notes[1] || 'Built stable service layers and iterative API workflows.',
    },
    {
      skill: snapshot[2] || 'Tooling and workflow',
      proof: props.notes[2] || 'Maintained fast lint-build-ship loops for reliability.',
    },
  ]

  return copy.sceneLabels.map((label, index) => {
    const slot = cycle * 13 + index * 5
    const nextLabel = copy.sceneLabels[(index + 1) % copy.sceneLabels.length]
    const driver = pickBySlot(driverTemplates, slot + 1)
    const prompt = copy.promptRequests[index] || copy.promptRequests[0]
    const command =
      driver === 'simonaude'
        ? `simonaude --dangerously-skip-permissions -p "${prompt}"`
        : `simondex --yolo -p "${prompt}"`

    let outputs: TerminalLine[] = []

    switch (index) {
      case 0:
        outputs = [
          {
            kind: 'system',
            text:
              locale === 'zh'
                ? `你好，我是 ${props.name}。这里是自动演示模式。`
                : `Hi, I'm ${props.name}. This terminal is running in autoplay demo mode.`,
          },
          {
            kind: 'task',
            text: `${copy.rolePrefix}: ${props.roleLine}.`,
          },
          {
            kind: 'result',
            text: `${copy.basedPrefix}: ${props.location}.`,
          },
          {
            kind: 'next',
            text:
              locale === 'zh'
                ? `${copy.nextLead}: 进入「${nextLabel}」。`
                : `${copy.nextLead}: moving to "${nextLabel}".`,
          },
        ]
        break
      case 1:
        outputs = [
          {
            kind: 'plan',
            text: `${copy.focusLead}: ${focusNote}`,
          },
          {
            kind: 'tool',
            text:
              locale === 'zh'
                ? '我更偏向小步快跑、可验证、可迭代的交付方式。'
                : 'I favor small, verifiable increments with fast delivery loops.',
          },
          {
            kind: 'result',
            text:
              locale === 'zh'
                ? '目标是持续交付，同时保持代码结构清晰可维护。'
                : 'The goal is steady shipping while keeping architecture maintainable.',
          },
          {
            kind: 'next',
            text:
              locale === 'zh'
                ? `${copy.nextLead}: 进入「${nextLabel}」。`
                : `${copy.nextLead}: moving to "${nextLabel}".`,
          },
        ]
        break
      case 2:
        outputs = [
          {
            kind: 'plan',
            text: `${copy.stackLead}: ${formatStack(frontend)} / ${formatStack(backend)}.`,
          },
          {
            kind: 'result',
            text:
              locale === 'zh'
                ? `前端：${formatStack(frontend)}。后端：${formatStack(backend)}。`
                : `Frontend: ${formatStack(frontend)}. Backend: ${formatStack(backend)}.`,
          },
          {
            kind: 'check',
            text:
              locale === 'zh'
                ? '偏好类型安全、模块边界明确、可持续扩展。'
                : 'I optimize for type safety, clear boundaries, and long-term scalability.',
          },
          {
            kind: 'next',
            text:
              locale === 'zh'
                ? `${copy.nextLead}: 进入「${nextLabel}」。`
                : `${copy.nextLead}: moving to "${nextLabel}".`,
          },
        ]
        break
      case 3:
        outputs = [
          {
            kind: 'tool',
            text: `${copy.toolchainLead}: ${formatStack(tooling)}.`,
          },
          {
            kind: 'result',
            text:
              locale === 'zh'
                ? '默认工作节奏：lint -> build -> ship。'
                : 'Default rhythm: lint -> build -> ship.',
          },
          {
            kind: 'check',
            text:
              locale === 'zh'
                ? '我会优先保证反馈速度与交付稳定性。'
                : 'I keep feedback loops short and release quality stable.',
          },
          {
            kind: 'next',
            text:
              locale === 'zh'
                ? `${copy.nextLead}: 进入「${nextLabel}」。`
                : `${copy.nextLead}: moving to "${nextLabel}".`,
          },
        ]
        break
      case 4:
        outputs = [
          {
            kind: 'task',
            text: `${copy.skillsLead}: ${skillLines[0].skill}.`,
          },
          {
            kind: 'result',
            text: `${copy.proofLead}: ${skillLines[0].proof}`,
          },
          {
            kind: 'task',
            text: `${copy.skillsLead}: ${skillLines[1].skill}.`,
          },
          {
            kind: 'result',
            text: `${copy.proofLead}: ${skillLines[1].proof}`,
          },
          {
            kind: 'task',
            text: `${copy.skillsLead}: ${skillLines[2].skill}.`,
          },
          {
            kind: 'result',
            text: `${copy.proofLead}: ${skillLines[2].proof}`,
          },
          {
            kind: 'next',
            text:
              locale === 'zh'
                ? `${copy.nextLead}: 进入「${nextLabel}」。`
                : `${copy.nextLead}: moving to "${nextLabel}".`,
          },
        ]
        break
      default:
        outputs = [
          {
            kind: 'system',
            text:
              locale === 'zh'
                ? `联系我：${props.emails.primary}${props.emails.secondary ? ` / ${props.emails.secondary}` : ''}`
                : `Reach me at ${props.emails.primary}${props.emails.secondary ? ` / ${props.emails.secondary}` : ''}.`,
          },
          {
            kind: 'tool',
            text:
              locale === 'zh'
                ? '支持远程协作，偏好直接沟通与结果导向。'
                : 'Open to remote collaboration with direct communication and outcome focus.',
          },
          {
            kind: 'check',
            text:
              locale === 'zh'
                ? '如果你有项目目标，我可以快速给出实现路径。'
                : 'If you have a project goal, I can quickly turn it into an execution path.',
          },
          {
            kind: 'next',
            text:
              locale === 'zh'
                ? `${copy.nextLead}: 回到「${nextLabel}」。`
                : `${copy.nextLead}: back to "${nextLabel}".`,
          },
        ]
    }

    return {
      label,
      command,
      outputs,
      footer:
        locale === 'zh'
          ? `${copy.footerPrefix}::${props.name} · role::${props.roleLine} · loop::${cycle + 1}`
          : `${copy.footerPrefix}::${props.name} · role::${props.roleLine} · loop::${cycle + 1}`,
    }
  })
}

function estimateSceneDuration(scene: TerminalScene) {
  const clearCommandChars = '/clear'.length
  const commandChars = scene.command.length
  const outputLines = scene.outputs.length
  const avgTypingDelay = (typingStepDelayMinMs + typingStepDelayMaxMs) / 2
  const typingBudget = commandChars * avgTypingDelay
  const clearTailBudget =
    clearCommandChars * avgTypingDelay + clearFramePauseMs + clearBlankAfterExecuteMs
  const loadingBudget = submitPauseMs + (loadingPhaseMinMs + loadingPhaseMaxMs) / 2
  const revealBudget = outputLines * (outputStepDelayMs + outputStepJitterMs / 2)
  const readingBudget = readingHoldForScene(scene)

  const rawDuration =
    typingStartDelayMs +
    typingBudget +
    loadingBudget +
    revealBudget +
    readingBudget +
    clearTailBudget

  return Math.max(minSceneDurationMs, Math.min(maxSceneDurationMs, rawDuration))
}

function lineKindClass(kind: TerminalLineKind) {
  switch (kind) {
    case 'system':
      return 'text-[var(--atlas-terminal-muted)]'
    case 'task':
      return 'text-[var(--atlas-terminal-text)]'
    case 'plan':
      return 'text-[var(--atlas-terminal-accent-soft)]'
    case 'tool':
      return 'text-[var(--atlas-terminal-warning)]'
    case 'result':
      return 'text-[var(--atlas-terminal-text)]'
    case 'check':
      return 'text-[var(--atlas-terminal-success)]'
    case 'next':
      return 'text-[var(--atlas-terminal-accent-soft)]'
    default:
      return 'text-[var(--atlas-terminal-text)]'
  }
}

function linePrefix(kind: TerminalLineKind) {
  switch (kind) {
    case 'system':
      return '• '
    case 'next':
      return '→ '
    default:
      return ''
  }
}

export function HomeLabTerminal(props: HomeLabTerminalProps) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [cycle, setCycle] = useState(0)
  const scenes = useMemo(() => buildScenes(props, cycle), [props, cycle])

  const locale = props.copyLocale || 'en'
  const copy = copyByLocale[locale]

  const currentScene = scenes[sceneIndex]
  const currentSceneDuration = useMemo(
    () => estimateSceneDuration(currentScene),
    [currentScene]
  )

  const hudStats = useMemo(() => {
    const seed = cycle * 37 + sceneIndex * 19 + currentScene.label.length * 13
    const contextUsed = 24 + (seed % 34)
    const contextLeft = 100 - contextUsed
    const inMillions = (2.6 + ((seed * 17) % 230) / 100).toFixed(1)
    const outThousands = (18 + ((seed * 23) % 220) / 10).toFixed(1)
    const weeklyLimitPercent = 42 + ((seed * 11) % 44)

    return {
      contextLeft,
      contextUsed,
      tokensIn: `${inMillions}M`,
      tokensOut: `${outThousands}K`,
      weeklyLimitPercent,
    }
  }, [cycle, sceneIndex, currentScene.label])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSceneIndex((current) => {
        const next = (current + 1) % scenes.length

        if (next === 0) {
          setCycle((value) => value + 1)
        }

        return next
      })
    }, currentSceneDuration)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentSceneDuration, sceneIndex, scenes.length])

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
              key={`${sceneIndex}-${currentScene.label}-${currentScene.command}-${cycle}-${locale}`}
              scene={currentScene}
              loadingWords={copy.loadingWords}
            />
          </div>

          <div className="border-t border-[var(--atlas-terminal-border)] px-4 py-3 font-mono sm:px-5">
            <div className="flex flex-col gap-2 text-[0.62rem] leading-5 text-[var(--atlas-terminal-muted)] sm:flex-row sm:items-center sm:justify-between sm:text-[0.66rem]">
              <p className="break-words">
                {copy.hud.contextLeft} {hudStats.contextLeft}% left · {copy.hud.contextUsed} {hudStats.contextUsed}% used · {hudStats.tokensIn} {copy.hud.inLabel} · {hudStats.tokensOut} {copy.hud.outLabel}
              </p>
              <div className="flex items-center gap-2 text-[0.62rem] sm:text-[0.66rem]">
                <span className="text-[var(--atlas-terminal-text)]">
                  {copy.hud.weeklyLimit}
                </span>
                <div className="h-1.5 w-28 overflow-hidden border border-[var(--atlas-terminal-border)] bg-[color-mix(in_srgb,var(--atlas-terminal-window-bottom)_82%,transparent)] sm:w-36">
                  <div
                    className="h-full bg-[linear-gradient(90deg,color-mix(in_srgb,var(--atlas-terminal-accent-soft)_86%,white_14%),color-mix(in_srgb,var(--atlas-terminal-accent-soft)_58%,var(--atlas-terminal-border)_42%))] transition-[width] duration-700 ease-out"
                    style={{ width: `${hudStats.weeklyLimitPercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[var(--atlas-terminal-accent-soft)]">
                  {hudStats.weeklyLimitPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TerminalPlayback({
  scene,
  loadingWords,
}: {
  scene: TerminalScene
  loadingWords: string[]
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const clearCommand = '/clear'
  const [clearTypedLength, setClearTypedLength] = useState(0)
  const [showClearTail, setShowClearTail] = useState(false)
  const [isContentCleared, setIsContentCleared] = useState(false)
  const [typedLength, setTypedLength] = useState(0)
  const [showOutputs, setShowOutputs] = useState(0)
  const [loadingWord, setLoadingWord] = useState('')
  const [spinnerFrameIndex, setSpinnerFrameIndex] = useState(0)
  const postOutputHoldMs = useMemo(() => readingHoldForScene(scene), [scene])

  const visibleCommand = scene.command.slice(0, typedLength)
  const visibleClearCommand = clearCommand.slice(0, clearTypedLength)
  const visibleOutputs = scene.outputs.slice(0, showOutputs)
  const shouldShowLoading = Boolean(loadingWord)
  const spinnerGlyph = spinnerFrames[spinnerFrameIndex % spinnerFrames.length]
  const shouldShowPromptCaret = typedLength < scene.command.length
  const shouldShowClearCaret = showClearTail && clearTypedLength < clearCommand.length
  const primaryPromptText = isContentCleared ? '' : visibleCommand

  useEffect(() => {
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
        schedule(() => {
          setShowClearTail(true)
          setClearTypedLength(0)

          const typeClear = (clearIndex: number) => {
            if (clearIndex >= clearCommand.length) {
              schedule(() => {
                setShowClearTail(false)
                setIsContentCleared(true)
              }, clearBlankAfterExecuteMs)
              return
            }

            setClearTypedLength(clearIndex + 1)
            schedule(
              () => typeClear(clearIndex + 1),
              typingDelayForChar(clearCommand[clearIndex])
            )
          }

          typeClear(0)
        }, postOutputHoldMs)
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
      const selectedWord = pickBySlot(loadingWords, phaseStartedAt)

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
  }, [loadingWords, postOutputHoldMs, scene])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    viewport.scrollTop = viewport.scrollHeight
  }, [scene.label, clearTypedLength, showClearTail, showOutputs, typedLength, shouldShowLoading, isContentCleared])

  return (
    <div
      ref={viewportRef}
      className="atlas-terminal-scroll flex min-h-0 flex-1 flex-col justify-start space-y-3 overflow-x-hidden overflow-y-auto px-4 py-5 font-mono text-[0.84rem] leading-6 text-[var(--atlas-terminal-text)] sm:px-5 sm:text-[0.88rem]"
    >
      <div className="min-w-0">
        <p className="min-w-0">
          <span className="whitespace-nowrap text-[var(--atlas-terminal-accent-soft)]">
            simon@lab
          </span>{' '}
          <span className="whitespace-nowrap text-[var(--atlas-terminal-muted)]">
            ~/workspace
          </span>{' '}
          <span className="whitespace-nowrap text-[var(--atlas-terminal-success)]">
            $
          </span>{' '}
          <span className="whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
            {primaryPromptText}
          </span>
          {!isContentCleared && shouldShowPromptCaret ? (
            <span className="atlas-terminal-caret ml-0.5 shrink-0" aria-hidden="true" />
          ) : null}
        </p>
      </div>

      {!isContentCleared && (
        <>
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
              key={`${scene.label}-${index}-${line.kind}-${line.text}`}
              className={`${lineKindClass(line.kind)} atlas-terminal-line break-words`}
            >
              <span className="text-[var(--atlas-terminal-accent-soft)]">
                {linePrefix(line.kind)}
              </span>
              {line.text}
            </p>
          ))}

          {visibleOutputs.length === scene.outputs.length && !showClearTail && (
            <p className="atlas-terminal-line text-[var(--atlas-terminal-muted)]/90">
              <span className="text-[var(--atlas-terminal-accent-soft)]">:: </span>
              {scene.footer}
            </p>
          )}

          {showClearTail && (
            <div className="min-w-0">
              <p className="min-w-0 atlas-terminal-line">
                <span className="whitespace-nowrap text-[var(--atlas-terminal-accent-soft)]">
                  simon@lab
                </span>{' '}
                <span className="whitespace-nowrap text-[var(--atlas-terminal-muted)]">
                  ~/workspace
                </span>{' '}
                <span className="whitespace-nowrap text-[var(--atlas-terminal-success)]">
                  $
                </span>{' '}
                <span className="whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
                  {visibleClearCommand}
                </span>
                {shouldShowClearCaret ? (
                  <span className="atlas-terminal-caret ml-0.5 shrink-0" aria-hidden="true" />
                ) : null}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
