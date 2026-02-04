export function serializeNode(node: any): string {
  if (node.type.name === 'doc') {
    const result: string[] = []
    node.content.forEach((child: any) => {
      result.push(serializeNode(child))
    })
    return result.join('')
  }
  
  if (node.type.name === 'text') {
    return node.text
  }

  if (node.type.name === 'paragraph') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return content + '\n\n'
  }

  if (node.type.name === 'heading') {
    const level = node.attrs?.level || 1
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return '#'.repeat(level) + ' ' + content + '\n\n'
  }

  if (node.type.name === 'hard_break') {
    return '\n'
  }

  if (node.type.name === 'bullet_list') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return content + '\n'
  }

  if (node.type.name === 'ordered_list') {
    let content = ''
    let index = 1
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(index + '. ' + serializeNode(child).trim() + '\n')
        index++
      })
      content = contentArray.join('')
    }
    return content + '\n'
  }

  if (node.type.name === 'list_item') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return '- ' + content.trim() + '\n'
  }

  if (node.type.name === 'code_block') {
    let content = ''
    if (node.content) {
      const contentArray: string[] = []
      node.content.forEach((child: any) => {
        contentArray.push(serializeNode(child))
      })
      content = contentArray.join('')
    }
    return '```\n' + content + '```\n\n'
  }

  let content = ''
  if (node.content) {
    const contentArray: string[] = []
    node.content.forEach((child: any) => {
      contentArray.push(serializeNode(child))
    })
    content = contentArray.join('')
  }
  return content
}