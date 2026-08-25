import type { Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import html2canvas from 'html2canvas'
import JSPDF from 'jspdf'
import { h, ref } from 'vue'
import { previewResumeExport, submitResumeExport } from '@/shared/api/career-plan'

/** 简历可勾选导出的模块（code 与后端 §4.18 保持一致） */
export type ResumeSectionKey =
  'education' | 'awards' | 'skills' | 'practices' | 'certificates' | 'selfEvaluation'

export interface ResumeSectionOption {
  key: ResumeSectionKey
  label: string
}

export const RESUME_SECTIONS: readonly ResumeSectionOption[] = [
  { key: 'education', label: '教育背景' },
  { key: 'awards', label: '获奖情况' },
  { key: 'skills', label: '技能与兴趣' },
  { key: 'practices', label: '实践经历' },
  { key: 'certificates', label: '证书' },
  { key: 'selfEvaluation', label: '自我评价' },
]

/** 导出用途 */
export type ResumePurpose = 'external' | 'internal'

/** 后端简历导出预览返回的栏目 */
interface ResumeExportPreviewSection {
  code: string
  name: string
  selected: boolean
  disabled: boolean
}

/** ResumeTemplate 暴露给导出器的句柄 */
export interface ResumeExportHandle {
  $el: HTMLElement
  applyExportOptions?: (sections: ResumeSectionKey[], generatedAt: string) => void
  resetExportOptions?: () => void
}

/** 生成时间（用于简历页脚标注） */
function formatGeneratedAt(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `${date} ${time}`
}

/** 格式化后端返回的业务有效期（expireAt） */
function formatExpireAt(expireAt: string): string {
  const d = new Date(expireAt)
  if (Number.isNaN(d.getTime())) return expireAt
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return `${date} ${time}`
}

/** 渲染模块勾选与用途单选 UI（动态生成的 VNode 无法使用 scoped 样式，故使用内联样式） */
function renderSectionPicker(
  sections: ResumeExportPreviewSection[],
  selected: Ref<ResumeSectionKey[]>,
  purpose: Ref<ResumePurpose>,
) {
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, [
    ...sections.map((section) => {
      const key = section.code as ResumeSectionKey
      const checked = selected.value.includes(key)
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
                ? [...new Set([...selected.value, key])]
                : selected.value.filter((k) => k !== key)
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
              name: 'resume-export-purpose',
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
              name: 'resume-export-purpose',
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
 * 简历 PDF 导出
 * 优先走后端导出（预览选栏目 → 提交生成 → 下载），后端不可用时回退本地 html2canvas + jspdf。
 */
export function useResumeExport() {
  let exporting = false

  async function chooseSections(
    sections: ResumeExportPreviewSection[],
  ): Promise<{ sections: ResumeSectionKey[]; purpose: ResumePurpose } | null> {
    const selected = ref<ResumeSectionKey[]>(
      sections.filter((s) => s.selected).map((s) => s.code as ResumeSectionKey),
    )
    const purpose = ref<ResumePurpose>('external')
    try {
      await ElMessageBox.confirm(
        renderSectionPicker(sections, selected, purpose),
        '选择要导出的简历模块',
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

  /** 本地 html2canvas + jspdf 兜底生成 */
  async function exportLocally(resumeRef: ResumeExportHandle, sections: ResumeSectionKey[]) {
    const el = resumeRef.$el
    resumeRef.applyExportOptions?.(sections, formatGeneratedAt())

    // 确保元素可被 html2canvas 捕获
    el.style.display = 'block'
    el.style.visibility = 'visible'
    el.style.opacity = '1'

    await new Promise((resolve) => setTimeout(resolve, 400))

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: el.scrollWidth,
      height: el.scrollHeight,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new JSPDF('p', 'mm', 'a4')
    const pw = pdf.internal.pageSize.getWidth()
    const ph = (canvas.height * pw) / canvas.width
    const pageH = pdf.internal.pageSize.getHeight()

    if (ph <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pw, ph)
    } else {
      const totalPages = Math.ceil(ph / pageH)
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -i * pageH, pw, ph)
      }
    }

    pdf.save('个人简历.pdf')
    ElMessage.success('简历 PDF 已下载')
  }

  async function exportResumePDF(resumeRef: ResumeExportHandle | null) {
    if (exporting) return
    if (!resumeRef) {
      ElMessage.error('简历模板未就绪')
      return
    }

    // 1) 拉取后端预览栏目；异常时回退本地常量并标记本地模式
    let sections: ResumeExportPreviewSection[] = []
    let localMode = false
    try {
      const preview = await previewResumeExport()
      if (!preview?.sections?.length) throw new Error('empty sections')
      sections = preview.sections
    } catch {
      sections = RESUME_SECTIONS.map((s) => ({
        code: s.key,
        name: s.label,
        selected: true,
        disabled: false,
      }))
      localMode = true
    }

    // 2) 弹窗勾选栏目 + 选择用途
    const chosen = await chooseSections(sections)
    if (!chosen) return

    exporting = true
    ElMessage.info('正在生成简历 PDF...')

    try {
      let result: { downloadUrl: string; expireAt: string } | null = null
      // 3) 提交后端导出；本地模式（预览已失败）下后端不可用，跳过提交直接走本地生成
      if (!localMode) {
        try {
          result = await submitResumeExport({
            sections: chosen.sections,
            fileType: 'pdf',
            purpose: chosen.purpose,
          })
        } catch {
          result = null
        }
      }

      if (result) {
        window.open(result.downloadUrl, '_blank')
        ElMessage.success(`简历导出任务已创建，链接有效期至 ${formatExpireAt(result.expireAt)}`)
      } else {
        // 4) 后端接口异常时回退本地 html2canvas + jspdf 生成
        ElMessage.warning('后端导出不可用，已使用本地生成')
        await exportLocally(resumeRef, chosen.sections)
      }
    } catch {
      ElMessage.error('PDF 生成失败，请重试')
    } finally {
      resumeRef.resetExportOptions?.()
      exporting = false
    }
  }

  return { exportResumePDF }
}
