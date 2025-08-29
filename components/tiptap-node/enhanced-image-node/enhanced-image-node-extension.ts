import { Node, mergeAttributes } from '@tiptap/react'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { EnhancedImageNode as EnhancedImageNodeComponent } from './enhanced-image-node'

export type ImageAlignment = 'left' | 'center' | 'right'

export interface EnhancedImageNodeOptions {
  /**
   * HTML attributes to add to the image element.
   * @default {}
   * @example { class: 'foo' }
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    enhancedImage: {
      setEnhancedImage: (options: {
        src: string
        alt?: string
        title?: string
        alignment?: ImageAlignment
        width?: number
        height?: number
      }) => ReturnType
      setImageAlignment: (alignment: ImageAlignment) => ReturnType
    }
  }
}

/**
 * Enhanced Image node extension with alignment support
 */
export const EnhancedImageNode = Node.create<EnhancedImageNodeOptions>({
  name: 'image',

  group: 'block',

  draggable: true,

  atom: true,

  inline: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {}
          }
          return { src: attributes.src }
        },
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute('alt'),
        renderHTML: (attributes) => {
          if (!attributes.alt) {
            return {}
          }
          return { alt: attributes.alt }
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute('title'),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {}
          }
          return { title: attributes.title }
        },
      },
      alignment: {
        default: 'center',
        parseHTML: (element) =>
          element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes) => {
          return { 'data-alignment': attributes.alignment }
        },
      },
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('width') || element.style.width
          return width ? Number.parseInt(width, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute('height') || element.style.height
          return height ? Number.parseInt(height, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {}
          }
          return { height: attributes.height }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const src = element.getAttribute('src')
          return src ? null : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(EnhancedImageNodeComponent)
  },

  addCommands() {
    return {
      setEnhancedImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
      setImageAlignment:
        (alignment) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { alignment })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // 이미지가 선택된 상태에서 정렬 단축키
      'Mod-Shift-l': ({ editor }) => {
        if (editor.isActive('image')) {
          return editor.commands.setImageAlignment('left')
        }
        return false
      },
      'Mod-Shift-e': ({ editor }) => {
        if (editor.isActive('image')) {
          return editor.commands.setImageAlignment('center')
        }
        return false
      },
      'Mod-Shift-r': ({ editor }) => {
        if (editor.isActive('image')) {
          return editor.commands.setImageAlignment('right')
        }
        return false
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      // 드래그 앤 드롭 플러그인
      new Plugin({
        key: new PluginKey('imageDragDrop'),
        props: {
          handleDOMEvents: {
            drop: (view, event) => {
              const coords = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })

              if (!coords) return false

              // 드래그된 이미지 데이터 확인
              const imageData = event.dataTransfer?.getData(
                'application/x-tiptap-image',
              )
              const draggedPos = event.dataTransfer?.getData('text/plain')

              if (!imageData && !draggedPos) return false

              let sourcePos: number
              let sourceNode: any

              if (imageData) {
                try {
                  const data = JSON.parse(imageData)
                  sourcePos = data.pos
                  sourceNode = view.state.doc.nodeAt(sourcePos)
                } catch {
                  return false
                }
              } else if (draggedPos) {
                sourcePos = Number.parseInt(draggedPos, 10)
                sourceNode = view.state.doc.nodeAt(sourcePos)
              } else {
                return false
              }

              if (!sourceNode || sourceNode.type.name !== 'image') return false

              const targetPos = coords.pos

              // 같은 위치면 무시
              if (Math.abs(sourcePos - targetPos) < sourceNode.nodeSize)
                return false

              const tr = view.state.tr

              // 원본 위치에서 노드 삭제
              tr.delete(sourcePos, sourcePos + sourceNode.nodeSize)

              // 삭제로 인한 위치 조정
              const adjustedTargetPos =
                targetPos > sourcePos
                  ? targetPos - sourceNode.nodeSize
                  : targetPos

              // 새 위치에 노드 삽입 (모든 속성 유지)
              tr.insert(
                adjustedTargetPos,
                sourceNode.copy(sourceNode.content, sourceNode.marks),
              )

              view.dispatch(tr)
              event.preventDefault()
              return true
            },
            dragover: (view, event) => {
              event.preventDefault()
              return false
            },
          },
        },
      }),
    ]
  },
})

export default EnhancedImageNode
