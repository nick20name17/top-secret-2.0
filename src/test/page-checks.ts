import axe from 'axe-core'
import { expect } from 'vitest'
import { page } from 'vitest/browser'
import { z } from 'zod/mini'

function sticksOut(element: HTMLElement) {
  const wide = element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1
  const tall = element.clientHeight > 0 && element.scrollHeight > element.clientHeight + 1
  if (!wide && !tall) return false
  const { overflowX, overflowY } = getComputedStyle(element)
  return (wide && overflowX === 'visible') || (tall && overflowY === 'visible')
}

function isStretched(element: HTMLElement) {
  if (!(element instanceof HTMLImageElement) || element.naturalHeight === 0) return false
  const distortion =
    (element.width * element.naturalHeight) / (element.height * element.naturalWidth)
  return getComputedStyle(element).objectFit === 'fill' && Math.abs(distortion - 1) > 0.02
}

function differsFromTwin(element: HTMLElement) {
  const twin = element.previousElementSibling
  if (twin?.tagName !== element.tagName || twin.className !== element.className) return false
  const box = element.getBoundingClientRect()
  const twinBox = twin.getBoundingClientRect()
  const inOneRow = box.top < twinBox.bottom && twinBox.top < box.bottom
  return inOneRow && Math.abs(box.height - twinBox.height) > 1
}

function layoutProblems(element: Element) {
  if (!(element instanceof HTMLElement)) return []
  return [
    sticksOut(element) && 'Content sticks out of its box',
    isStretched(element) && 'Image is stretched',
    differsFromTwin(element) && 'Height differs from the same element next to it',
  ].filter((problem) => problem !== false)
}

async function layoutProblemsAt(width: number) {
  await page.viewport(width, 896)
  return [...document.body.getElementsByTagName('*')].flatMap((element) =>
    layoutProblems(element).map(
      (problem) => `At ${width} px: ${problem}: ${element.outerHTML.slice(0, 120)}`,
    ),
  )
}

// The browser does not count a test's clicks as user input, so a shift within 500 ms of one is allowed here
const shifts: PerformanceEntry[] = []
const shiftObserver = new PerformanceObserver((list) => shifts.push(...list.getEntries()))
shiftObserver.observe({ type: 'layout-shift' })
const inputTimes: number[] = []
for (const type of ['pointerdown', 'keydown', 'input']) {
  addEventListener(type, () => inputTimes.push(performance.now()), true)
}
const shiftSchema = z.object({
  sources: z.array(z.object({ node: z.nullable(z.instanceof(Element)) })),
})

function layoutShifts() {
  return [...shifts, ...shiftObserver.takeRecords()]
    .filter(
      ({ startTime }) => !inputTimes.some((time) => time <= startTime && startTime - time < 500),
    )
    .flatMap((shift) => shiftSchema.parse(shift).sources)
    .map(({ node }) => `Moved on its own: ${node?.outerHTML.slice(0, 120)}`)
}

const visualRules = ['color-contrast', 'link-in-text-block']

// A visual rule axe could not decide, such as text on a gradient, counts as a problem
async function axeProblems(theme: 'light' | 'dark', options: axe.RunOptions) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const { violations, incomplete } = await axe.run({
    ...options,
    resultTypes: ['violations', 'incomplete'],
  })
  return [...violations, ...incomplete.filter(({ id }) => visualRules.includes(id))].flatMap(
    ({ help, nodes }) =>
      nodes.map(({ html, any, all, none }) => {
        const reasons = [...any, ...all, ...none].map(({ message }) => message).join('; ')
        return `In the ${theme} theme: ${help}: ${html}: ${reasons}`
      }),
  )
}

// A test that renders no page has no landmark or heading to check
const pageRules = {
  'landmark-one-main': { enabled: false },
  'page-has-heading-one': { enabled: false },
}

async function pageProblems() {
  const wasDark = document.documentElement.classList.contains('dark')
  // Without transitions axe reads the final colours right after the theme changes
  const noTransitions = document.head.appendChild(document.createElement('style'))
  noTransitions.textContent = '*,*::before,*::after{transition:none!important}'
  const problems = [
    ...layoutShifts(),
    ...(await layoutProblemsAt(1280)),
    // The width the tests run at, so the page is left at it
    ...(await layoutProblemsAt(414)),
    ...(await axeProblems('light', { rules: page.getByRole('main').query() ? {} : pageRules })),
    ...(await axeProblems('dark', { runOnly: visualRules })),
  ]
  document.documentElement.classList.toggle('dark', wasDark)
  noTransitions.remove()
  return problems
}

export async function expectSoundPage() {
  await new Promise(requestAnimationFrame)
  const problems = document.body.childElementCount > 0 ? await pageProblems() : []
  await new Promise(requestAnimationFrame)
  shiftObserver.takeRecords()
  shifts.length = 0
  inputTimes.length = 0
  expect(problems).toEqual([])
}
