import type { BookmarkNode } from '../types'

const bookmark = (id: string, title: string, url: string, parentId: string): BookmarkNode => ({
  id,
  parentId,
  title,
  type: 'bookmark',
  url,
  children: [],
})

const folder = (
  id: string,
  title: string,
  parentId: string,
  children: BookmarkNode[],
  folderType?: BookmarkNode['folderType'],
): BookmarkNode => ({ id, parentId, title, type: 'folder', children, folderType })

export const MOCK_BOOKMARK_TREE: BookmarkNode[] = [
  folder('0', '', '', [
    folder(
      '1',
      '书签栏',
      '0',
      [
        bookmark('101', 'GitHub', 'https://github.com', '1'),
        bookmark('102', 'Google', 'https://www.google.com', '1'),
        bookmark('103', '知乎', 'https://www.zhihu.com', '1'),
        bookmark('104', '哔哩哔哩', 'https://www.bilibili.com', '1'),
        bookmark('105', '飞书', 'https://www.feishu.cn', '1'),
        bookmark('106', 'MDN', 'https://developer.mozilla.org', '1'),
        folder('110', '开发工具', '1', [
          bookmark('111', 'Vue.js', 'https://vuejs.org', '110'),
          bookmark('112', 'Vite', 'https://vite.dev', '110'),
          bookmark('113', 'TypeScript', 'https://www.typescriptlang.org', '110'),
          bookmark('114', 'Chrome 扩展文档', 'https://developer.chrome.com/docs/extensions', '110'),
          bookmark('115', 'Stack Overflow', 'https://stackoverflow.com', '110'),
          folder('116', '代码仓库', '110', [
            bookmark('117', 'GitHub', 'https://github.com', '116'),
            bookmark('118', 'GitLab', 'https://gitlab.com', '116'),
          ]),
        ]),
        folder('120', '设计灵感', '1', [
          bookmark('121', 'Dribbble', 'https://dribbble.com', '120'),
          bookmark('122', 'Behance', 'https://www.behance.net', '120'),
          bookmark('123', 'Awwwards', 'https://www.awwwards.com', '120'),
          bookmark('124', 'Pinterest', 'https://www.pinterest.com', '120'),
        ]),
        folder('130', '效率工具', '1', [
          bookmark('131', 'Notion', 'https://www.notion.so', '130'),
          bookmark('132', 'Excalidraw', 'https://excalidraw.com', '130'),
          bookmark('133', 'Figma', 'https://www.figma.com', '130'),
          bookmark('134', 'DeepL', 'https://www.deepl.com', '130'),
        ]),
        folder('140', '稍后阅读', '1', []),
      ],
      'bookmarks-bar',
    ),
    folder('2', '其他书签', '0', [
      folder('210', '云服务', '2', [
        bookmark('211', 'Cloudflare', 'https://www.cloudflare.com', '210'),
        bookmark('212', 'Vercel', 'https://vercel.com', '210'),
      ]),
      bookmark('220', 'Internet Archive', 'https://archive.org', '2'),
    ], 'other'),
    folder('3', '移动设备书签', '0', [], 'mobile'),
  ]),
]

