import MarkdownIt from 'markdown-it'
import { undo, redo } from 'prosemirror-history'
import { baseKeymap } from 'prosemirror-commands'

export const md: MarkdownIt = new MarkdownIt({
  highlight: function (str: string, lang: string): string {
    return `<pre class="code-block"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>` // ✅ No circular reference
  }
})

// Custom Tab key handler
const tabHandler = () => (state: any, dispatch: any) => {
  const spaces = '    ' // 4 spaces for tab
  dispatch(state.tr.insertText(spaces))
  return true
}

export const customKeymap = {
  ...baseKeymap,
  'Tab': tabHandler(),
  'Mod-z': undo,
  'Mod-y': redo,
  'Mod-Shift-z': redo,
}

export const editorStyles = `
  .code-block {
    background-color: #0d1117;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding-left: 16px;
    padding-right: 16px;
    margin: 16px 0;
    overflow-x: auto;
  }
  
  .code-block code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    color: #c9d1d9;
    display: block;
  }
  
  /* Inline code */
  p code, li code {
    background-color: rgba(110, 118, 129, 0.4);
    border-radius: 6px;
    padding: 0.2em 0.4em;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 85%;
  }
`