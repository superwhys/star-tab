import type { BackgroundPreset } from '../types'

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'stellar-drift',
    name: '星河流尘',
    description: '多层星尘穿行的深蓝星海',
    kind: 'canvas-drift',
    className: 'background--stellar-drift',
  },
  {
    id: 'meteor-night',
    name: '流星夜',
    description: '频繁划过的明亮星迹',
    kind: 'canvas-meteor',
    className: 'background--meteor-night',
  },
  {
    id: 'indigo-nebula',
    name: '靛蓝星云',
    description: '持续流动的靛蓝云团',
    kind: 'ambient',
    className: 'background--indigo-nebula',
  },
  {
    id: 'violet-orbit',
    name: '紫曜轨道',
    description: '紫罗兰色星云与轨道光',
    kind: 'ambient',
    className: 'background--violet-orbit',
  },
  {
    id: 'lunar-mist',
    name: '月海薄雾',
    description: '冷灰月光下的朦胧深空',
    kind: 'ambient',
    className: 'background--lunar-mist',
  },
  {
    id: 'blue-horizon',
    name: '蓝星地平线',
    description: '远方行星弧面的幽蓝微光',
    kind: 'ambient',
    className: 'background--blue-horizon',
  },
]

export const BACKGROUND_IDS = BACKGROUND_PRESETS.map((preset) => preset.id)
