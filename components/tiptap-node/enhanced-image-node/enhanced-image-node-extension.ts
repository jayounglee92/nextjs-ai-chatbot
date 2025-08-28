import { Node, mergeAttributes } from '@tiptap/react'
import { ReactNodeViewRenderer } from '@tiptap/react'
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
})

export default EnhancedImageNode
