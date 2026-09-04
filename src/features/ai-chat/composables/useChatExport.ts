import type { ChatMessage, ExportFormat } from '../types'
/**
 * useChatExport - 对话导出（TXT / MD / PDF）
 *
 * - TXT/MD：组装纯文本 → Blob → URL.createObjectURL → <a download> 触发下载
 * - PDF：window.open 新窗口 → document.write 完整 HTML（含 @page 打印样式）→ window.print
 *   弹窗被拦截时 ElMessage.error 提示
 * - 富文本消息通过 richToPlain 转纯文本，用户输入用 escapeHtml 转义防注入
 */
import { ElMessage } from 'element-plus'
import { richToPlain } from '../utils/richText'

interface ExportRow {
  sender: string
  time: string
  content: string
}

function dateStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

function toRows(messages: ChatMessage[], userName: string): ExportRow[] {
  return messages.map((m) => ({
    sender: m.role === 'ai' ? '档案智能助手' : userName,
    time: m.time,
    content: m.richContent ? richToPlain(m.richContent) : m.content,
  }))
}

function genTXT(rows: ExportRow[], userName: string): string {
  const lines = [
    '档案智能助手 · 对话记录',
    `导出时间：${new Date().toLocaleString('zh-CN')}`,
    `对话方：${userName}`,
    '────────────────────────────',
    '',
  ]
  for (const row of rows) {
    lines.push(`【${row.sender}】 ${row.time}`)
    lines.push(row.content)
    lines.push('')
  }
  return lines.join('\n')
}

function genMD(rows: ExportRow[], userName: string): string {
  const lines = [
    '# 档案智能助手 · 对话记录',
    '',
    `> 导出时间：${new Date().toLocaleString('zh-CN')}  `,
    `> 对话方：${userName}`,
    '',
    '---',
    '',
  ]
  for (const row of rows) {
    lines.push(`### ${row.sender} · ${row.time}`)
    lines.push('')
    // 保留换行，MD 段落用空行分隔
    lines.push(row.content.split('\n').join('  \n'))
    lines.push('')
  }
  return lines.join('\n')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>')
}

function exportPDF(rows: ExportRow[], userName: string): boolean {
  const win = window.open('', '_blank')
  if (!win) {
    ElMessage.error('请允许浏览器弹窗以生成 PDF')
    return false
  }

  const bodyHtml = rows
    .map(
      (row) => `
    <div class="msg">
      <div class="meta">${escapeHtml(row.sender)} · ${escapeHtml(row.time)}</div>
      <div class="content">${escapeHtml(row.content)}</div>
    </div>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>档案智能助手对话记录 - ${escapeHtml(userName)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #1f2937; line-height: 1.7; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 20px; color: #1e3a5f; border-bottom: 2px solid #d4a574; padding-bottom: 8px; }
  .info { color: #6b7280; font-size: 13px; margin: 8px 0 24px; }
  .msg { margin-bottom: 18px; padding: 12px 16px; border-radius: 8px; background: #f9fafb; page-break-inside: avoid; }
  .msg .meta { font-weight: 600; color: #1e3a5f; font-size: 13px; margin-bottom: 6px; }
  .msg .content { font-size: 14px; white-space: pre-wrap; word-break: break-word; }
</style>
</head>
<body>
  <h1>档案智能助手 · 对话记录</h1>
  <div class="info">导出时间：${escapeHtml(new Date().toLocaleString('zh-CN'))} ｜ 对话方：${escapeHtml(userName)}</div>
  ${bodyHtml}
  <script>
    window.onload = function () { window.focus(); window.print(); }
  <\/script>
</body>
</html>`

  win.document.open()
  win.document.write(html)
  win.document.close()
  return true
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function useChatExport() {
  function exportConversation(messages: ChatMessage[], userName: string, format: ExportFormat) {
    const rows = toRows(messages, userName)
    if (rows.length === 0) {
      ElMessage.info('暂无对话记录可导出')
      return
    }

    if (format === 'pdf') {
      exportPDF(rows, userName)
      return
    }

    if (format === 'txt') {
      downloadBlob(genTXT(rows, userName), 'text/plain', `档案智能助手对话_${dateStr()}.txt`)
      ElMessage.success('已导出为 TXT 格式')
      return
    }

    // md
    downloadBlob(genMD(rows, userName), 'text/markdown', `档案智能助手对话_${dateStr()}.md`)
    ElMessage.success('已导出为 MD 格式')
  }

  return { exportConversation }
}
