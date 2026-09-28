import type { BackgroundPreset } from '../types'

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'stellar-drift',
    name: '星河流尘',
    description: '斜贯夜空的银河与层叠流尘',
    kind: 'canvas-drift',
    className: 'background--stellar-drift',
  },
  {
    id: 'meteor-night',
    name: '流星夜',
    description: '疏朗夜空中不时划过的流星',
    kind: 'canvas-meteor',
    className: 'background--meteor-night',
  },
  {
    id: 'indigo-nebula',
    name: '靛蓝星云',
    description: '两片遥远星团与缓缓舒展的云雾',
    kind: 'ambient',
    className: 'background--indigo-nebula',
  },
  {
    id: 'violet-orbit',
    name: '紫曜轨道',
    description: '围绕北极点缓慢旋转的弧形星轨',
    kind: 'ambient',
    className: 'background--violet-orbit',
  },
  {
    id: 'lunar-mist',
    name: '月海薄雾',
    description: '稀疏星光下横向流动的银灰薄雾',
    kind: 'ambient',
    className: 'background--lunar-mist',
  },
  {
    id: 'blue-horizon',
    name: '蓝星地平线',
    description: '低垂的星群与弯曲地平微光',
    kind: 'ambient',
    className: 'background--blue-horizon',
  },
]

export const BACKGROUND_IDS = BACKGROUND_PRESETS.map((preset) => preset.id)

export { getBackgroundMotionProfile } from './motionProfiles'
export type { MotionProfile } from './motionProfiles'
