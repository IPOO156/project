import type { Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { h, ref } from 'vue'
import { previewArchiveExport, submitArchiveExport } from '@/shared/api/career-plan'

/** 档案导出预览返回的栏目（字段与 §4.16 一致：code/name/selected/disabled） */
export interface ArchiveExportPreviewSection {
  code: string
  name: string
  selected: boolean
  disabled: boolean
}

/** 导出用途（§4.17：internal 内部查看 / external 外部投递） */
export type ArchivePurpose = 'internal' | 'external'

/** 预览不可用时回退的固定栏目 */
const ARCHIVE_FALLBACK_SECTIONS: readonly ArchiveExportPreviewSection[] = [
  { code: 'education', name: '教育背景', selected: true, disabled: false },
  { code: 'awards', name: '获奖情况', selected: true, disabled: false },
  { code: 'skills', name: '技能与兴趣', selected: true, disabled: false },
  { code: 'practices', name: '实践经历', selected: true, disabled: false },
  { code: 'certificates', name: '证书', selected: true, disabled: false },
  { code: 'selfEvaluation', name: '自我评价', selected: true, disabled: false },
]

/** 格式化后端返回的业务有效期（expireAt）为 YYYY-MM-DD HH:mm */
function formatExpireAt(expireAt: string): string {
  const d = new Date(expireAt)
  if (Number.isNaN(d.getTime())) return expireAt
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `${date} ${time}`
}

/** 渲染栏目勾选与用途单选 UI（动态生成的 VNode 无法使用 scoped 样式，故使用内联样式） */
function renderSectionPicker(
  sections: ArchiveExportPreviewSection[],
  selected: Ref<string[]>,
  purpose: Ref<ArchivePurpose>,
) {
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
    ...sections.map((section) => {
      const checked = selected.value.includes(section.code)
      return h(
        'label',
        {
          key: section.code,
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: section.disabled ? 'not-allowed' : 'pointer',
            opacity: section.disabled ? '0.6' : '1',
          },
        },
        [
          h('input', {
            type: 'checkbox',
            checked,
            disabled: section.disabled,
            onChange: (event: Event) => {
              const target = event.target as HTMLInputElement
              selected.value = target.checked
                ? [...new Set([...selected.value, section.code])]
                : selected.value.filter((code) => code !== section.code)
            },
          }),
          h('span', { style: { fontSize: '14px' } }, section.name),
        ],
      )
    }),
    h(
      'div',
      {
        style: {
          marginTop: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        },
      },
      [
        h('div', { style: { fontSize: '13px', color: '#64748b' } }, '导出用途'),
        h(
          'label',
          { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
          [
            h('input', {
              type: 'radio',
              name: 'archive-export-purpose',
              checked: purpose.value === 'external',
              onChange: () => {
                purpose.value = 'external'
              },
            }),
            h('span', { style: { fontSize: '14px' } }, '外部投递'),
          ],
        ),
        h(
          'label',
          { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
          [
            h('input', {
              type: 'radio',
              name: 'archive-export-purpose',
              checked: purpose.value === 'internal',
              onChange: () => {
                purpose.value = 'internal'
              },
            }),
            h('span', { style: { fontSize: '14px' } }, '内部查看'),
          ],
        ),
      ],
    ),
  ])
}

/**
 * 档案 PDF 导出
 * 先预览（GET /profile/export/preview）拿栏目列表，异常回退固定栏目；
 * 弹窗勾选栏目 + 选择用途后提交（POST /profile/export），成功后打开下载链接。
 * 后端导出无本地模板兜底：提交失败仅报错。
 */
export function useArchiveExport() {
  let exporting = false

  async function chooseSections(
    sections: ArchiveExportPreviewSection[],
  ): Promise<{ sections: string[]; purpose: ArchivePurpose } | null> {
    const selected = ref<string[]>(sections.filter((s) => s.selected).map((s) => s.code))
    const purpose = ref<ArchivePurpose>('external')
    try {
      await ElMessageBox.confirm(
        renderSectionPicker(sections, selected, purpose),
        '选择要导出的档案模块',
        {
          confirmButtonText: '生成 PDF',
          cancelButtonText: '取消',
        },
      )
      return selected.value.length > 0 ? { sections: selected.value, purpose: purpose.value } : null
    } catch {
      return null
    }
  }

  async function exportArchivePDF() {
    if (exporting) return

    // 1) 拉取后端预览栏目；异常时回退本地固定栏目并提示预览不可用
    let sections: ArchiveExportPreviewSection[]
    try {
      const preview = await previewArchiveExport()
      if (!preview?.sections?.length) throw new Error('empty sections')
      sections = preview.sections
    } catch {
      sections = [...ARCHIVE_FALLBACK_SECTIONS]
      ElMessage.warning('档案导出预览不可用，已使用默认栏目')
    }

    // 2) 弹窗勾选栏目 + 选择用途
    const chosen = await chooseSections(sections)
    if (!chosen) return

    exporting = true
    try {
      const result = await submitArchiveExport({
        sections: chosen.sections,
        fileType: 'pdf',
        purpose: chosen.purpose,
      })
      window.open(result.downloadUrl, '_blank')
      ElMessage.success(`档案导出任务已创建，链接有效期至 ${formatExpireAt(result.expireAt)}`)
    } catch {
      ElMessage.error('档案导出失败，请稍后重试')
    } finally {
      exporting = false
    }
  }

  return { exportArchivePDF }
}
