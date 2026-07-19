import type { ComponentPublicInstance } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import JSPDF from 'jspdf'

/**
 * 简历 PDF 导出
 * 将 ResumeTemplate 渲染为 A4 PDF 并下载
 */
export function useResumeExport() {
  let exporting = false

  async function exportResumePDF(resumeRef: ComponentPublicInstance | null) {
    if (exporting) return
    if (!resumeRef) {
      ElMessage.error('简历模板未就绪')
      return
    }

    exporting = true
    ElMessage.info('正在生成简历 PDF...')

    try {
      const el = resumeRef.$el as HTMLElement

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
    } catch {
      ElMessage.error('PDF 生成失败，请重试')
    } finally {
      exporting = false
    }
  }

  return { exportResumePDF }
}
