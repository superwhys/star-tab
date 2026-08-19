import type { BookmarkNode } from '../types'

export const CONSTELLATION_VIEWBOX = {
  width: 1000,
  height: 600,
} as const

export const CONSTELLATION_COLORS = [
  '#75e7c3',
  '#9382ff',
  '#ffc94c',
  '#68a7ff',
  '#ff776e',
  '#ccbfff',
] as const

export type ConstellationNodeKind = 'section' | 'folder' | 'bookmark' | 'more'

export interface ConstellationNode {
  id: string
  kind: ConstellationNodeKind
  title: string
  node: BookmarkNode
  section: BookmarkNode
  url?: string
  x: number
  y: number
  size: number
  color: string
  depth: number
  delay: number
  hiddenCount?: number
}

export interface ConstellationEdge {
  id: string
  from: string
  to: string
  color: string
}

export interface ConstellationLayout {
  nodes: ConstellationNode[]
  edges: ConstellationEdge[]
}

interface DraftNode extends ConstellationNode {
  fixed: boolean
  originX: number
  originY: number
}

interface QueuedBookmark {
  node: BookmarkNode
  parentId: string
  depth: number
  branchIndex: number
}

const MAX_VISIBLE_ITEMS = 48
const MAX_DEPTH = 2
const HORIZONTAL_PADDING = 45
const VERTICAL_PADDING = 42

export function buildConstellationLayout(sections: BookmarkNode[]): ConstellationLayout {
  const visibleSections = sections.filter((section) => section.type === 'folder')
  if (!visibleSections.length) return { nodes: [], edges: [] }

  const drafts: DraftNode[] = []
  const edges: ConstellationEdge[] = []
  const itemBudget = Math.max(2, Math.floor(MAX_VISIBLE_ITEMS / visibleSections.length))

  visibleSections.forEach((section, sectionIndex) => {
    const rootId = nodeKey(section.id, section.id)
    const rootPosition = getRootPosition(sectionIndex, visibleSections.length)
    const color = CONSTELLATION_COLORS[sectionIndex % CONSTELLATION_COLORS.length]
    const root = createDraftNode({
      id: rootId,
      kind: 'section',
      title: section.title || '书签',
      node: section,
      section,
      x: rootPosition.x,
      y: rootPosition.y,
      size: sectionIndex === 0 ? 58 : 48,
      color,
      depth: 0,
      delay: sectionIndex * -0.8,
      fixed: true,
    })
    drafts.push(root)

    if (sectionIndex > 0) {
      const mainRootId = nodeKey(visibleSections[0].id, visibleSections[0].id)
      edges.push(createEdge(mainRootId, rootId, color))
    }

    const totalDescendants = countDescendants(section)
    const realItemLimit = totalDescendants > itemBudget ? Math.max(1, itemBudget - 1) : itemBudget
    const queue: QueuedBookmark[] = section.children.map((node, branchIndex) => ({
      node,
      parentId: rootId,
      depth: 1,
      branchIndex,
    }))
    const displayed: QueuedBookmark[] = []

    while (queue.length && displayed.length < realItemLimit) {
      const current = queue.shift()
      if (!current) break
      displayed.push(current)

      if (current.node.type === 'folder' && current.depth < MAX_DEPTH) {
        const parentId = nodeKey(section.id, current.node.id)
        queue.push(
          ...current.node.children.map((node) => ({
            node,
            parentId,
            depth: current.depth + 1,
            branchIndex: current.branchIndex,
          })),
        )
      }
    }

    const childrenByParent = groupByParent(displayed)
    for (const item of displayed) {
      const id = nodeKey(section.id, item.node.id)
      const parent = drafts.find((candidate) => candidate.id === item.parentId) ?? root
      const siblings = childrenByParent.get(item.parentId) ?? [item]
      const siblingIndex = siblings.indexOf(item)
      const position = getChildPosition(parent, root, siblingIndex, siblings.length, section.id, item.depth)
      const kind = item.node.type === 'folder' ? 'folder' : 'bookmark'
      const nodeColor = CONSTELLATION_COLORS[
        (sectionIndex * 2 + item.branchIndex) % CONSTELLATION_COLORS.length
      ]

      drafts.push(
        createDraftNode({
          id,
          kind,
          title: item.node.title || (kind === 'folder' ? '未命名文件夹' : '未命名书签'),
          node: item.node,
          section,
          url: item.node.url,
          x: position.x,
          y: position.y,
          size: kind === 'folder' ? 36 : item.depth === 1 ? 30 : 25,
          color: nodeColor,
          depth: item.depth,
          delay: -hashUnit(id) * 4.5,
          fixed: false,
        }),
      )
      edges.push(createEdge(item.parentId, id, nodeColor))
    }

    const hiddenCount = Math.max(0, totalDescendants - displayed.length)
    if (hiddenCount > 0) {
      const id = `${rootId}:more`
      const siblings = childrenByParent.get(rootId) ?? []
      const position = getChildPosition(root, root, siblings.length, siblings.length + 1, section.id, 1)
      drafts.push(
        createDraftNode({
          id,
          kind: 'more',
          title: `还有 ${hiddenCount} 项`,
          node: section,
          section,
          x: position.x,
          y: position.y,
          size: 32,
          color,
          depth: 1,
          delay: -hashUnit(id) * 4.5,
          hiddenCount,
          fixed: false,
        }),
      )
      edges.push(createEdge(rootId, id, color))
    }
  })

  relaxLayout(drafts, edges)

  return {
    nodes: drafts.map(({ fixed: _fixed, originX: _originX, originY: _originY, ...node }) => node),
    edges,
  }
}

function createDraftNode(
  value: Omit<DraftNode, 'originX' | 'originY'>,
): DraftNode {
  return {
    ...value,
    originX: value.x,
    originY: value.y,
  }
}

function createEdge(from: string, to: string, color: string): ConstellationEdge {
  return { id: `${from}->${to}`, from, to, color }
}

function nodeKey(sectionId: string, nodeId: string): string {
  return `section:${sectionId}:node:${nodeId}`
}

function getRootPosition(index: number, count: number): { x: number; y: number } {
  const { width, height } = CONSTELLATION_VIEWBOX
  if (index === 0 || count === 1) return { x: width * 0.5, y: height * 0.5 }

  const satelliteCount = count - 1
  const angle = -0.62 + ((index - 1) / satelliteCount) * Math.PI * 2
  const radiusX = Math.min(325, 210 + satelliteCount * 13)
  const radiusY = Math.min(210, 145 + satelliteCount * 9)
  return {
    x: width * 0.5 + Math.cos(angle) * radiusX,
    y: height * 0.5 + Math.sin(angle) * radiusY,
  }
}

function getChildPosition(
  parent: DraftNode,
  sectionRoot: DraftNode,
  siblingIndex: number,
  siblingCount: number,
  seed: string,
  depth: number,
): { x: number; y: number } {
  if (depth === 1) {
    const perRing = 8
    const ring = Math.floor(siblingIndex / perRing)
    const positionInRing = siblingIndex % perRing
    const countInRing = Math.min(perRing, siblingCount - ring * perRing)
    const startAngle = hashUnit(seed) * Math.PI * 2 + ring * 0.3
    const angle = startAngle + (positionInRing / Math.max(1, countInRing)) * Math.PI * 2
    const radiusX = 158 + ring * 86
    const radiusY = 122 + ring * 68
    return {
      x: parent.x + Math.cos(angle) * radiusX,
      y: parent.y + Math.sin(angle) * radiusY,
    }
  }

  const outwardAngle = Math.atan2(parent.y - sectionRoot.y, parent.x - sectionRoot.x)
  const spread = siblingCount === 1 ? 0 : (siblingIndex / (siblingCount - 1) - 0.5) * 1.35
  const angle = outwardAngle + spread + (hashUnit(`${seed}:${parent.id}`) - 0.5) * 0.28
  const radius = 88
  return {
    x: parent.x + Math.cos(angle) * radius,
    y: parent.y + Math.sin(angle) * radius,
  }
}

function groupByParent(items: QueuedBookmark[]): Map<string, QueuedBookmark[]> {
  const result = new Map<string, QueuedBookmark[]>()
  for (const item of items) {
    const siblings = result.get(item.parentId) ?? []
    siblings.push(item)
    result.set(item.parentId, siblings)
  }
  return result
}

function countDescendants(folder: BookmarkNode): number {
  let count = 0
  const queue = [...folder.children]
  while (queue.length) {
    const current = queue.shift()
    if (!current) break
    count += 1
    queue.push(...current.children)
  }
  return count
}

function relaxLayout(nodes: DraftNode[], edges: ConstellationEdge[]): void {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))

  for (let iteration = 0; iteration < 52; iteration += 1) {
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      const left = nodes[leftIndex]
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const right = nodes[rightIndex]
        let dx = right.x - left.x
        let dy = right.y - left.y
        let distance = Math.hypot(dx, dy)
        const minimumDistance = (left.size + right.size) * 0.5 + (left.depth === 0 || right.depth === 0 ? 38 : 24)

        if (distance >= minimumDistance) continue
        if (distance < 0.001) {
          const angle = hashUnit(`${left.id}:${right.id}`) * Math.PI * 2
          dx = Math.cos(angle)
          dy = Math.sin(angle)
          distance = 1
        }

        const push = (minimumDistance - distance) * 0.18
        const pushX = (dx / distance) * push
        const pushY = (dy / distance) * push
        if (!left.fixed) {
          left.x -= pushX
          left.y -= pushY
        }
        if (!right.fixed) {
          right.x += pushX
          right.y += pushY
        }
      }
    }

    for (const edge of edges) {
      const from = nodeMap.get(edge.from)
      const to = nodeMap.get(edge.to)
      if (!from || !to) continue
      const dx = to.x - from.x
      const dy = to.y - from.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const targetDistance = from.depth === 0 && to.depth === 0 ? 235 : to.depth === 1 ? 158 : 90
      const correction = (distance - targetDistance) * 0.025
      const correctionX = (dx / distance) * correction
      const correctionY = (dy / distance) * correction

      if (!from.fixed) {
        from.x += correctionX
        from.y += correctionY
      }
      if (!to.fixed) {
        to.x -= correctionX
        to.y -= correctionY
      }
    }

    for (const node of nodes) {
      if (node.fixed) continue
      node.x += (node.originX - node.x) * 0.018
      node.y += (node.originY - node.y) * 0.018
      node.x = clamp(node.x, HORIZONTAL_PADDING, CONSTELLATION_VIEWBOX.width - HORIZONTAL_PADDING)
      node.y = clamp(node.y, VERTICAL_PADDING, CONSTELLATION_VIEWBOX.height - VERTICAL_PADDING)
    }
  }
}

function hashUnit(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967295
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}
