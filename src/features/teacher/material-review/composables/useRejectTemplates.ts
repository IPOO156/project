import { ref } from 'vue'

export const REJECT_TEMPLATES = [
  { label: '材料不完整', text: '申报材料不完整，请补充全部所需佐证材料后重新提交。' },
  { label: '佐证不足', text: '佐证材料不够充分，请补充更多证明材料以支持申报内容。' },
  { label: '信息有误', text: '填写信息存在错误，请核对后修正重新提交。' },
  { label: '不符合条件', text: '本次申报条件不符，请查看申报要求后确认是否符合资格。' },
  { label: '格式不符合要求', text: '上传文件格式不符合要求，请按要求格式重新上传。' },
  { label: '时间范围不符', text: '填写的经历时间范围与证明材料不一致，请核实后修改。' },
  { label: '重复申报', text: '该经历已申报过同类项目，请勿重复提交。' },
  { label: '内容描述不清', text: '申报内容描述不够清晰完整，请详细描述后重新提交。' },
]

export function useRejectTemplates() {
  const selectedTemplate = ref('')
  const comment = ref('')
  function applyTemplate(text: string) {
    comment.value = text
  }
  function clearComment() {
    comment.value = ''
    selectedTemplate.value = ''
  }
  return { selectedTemplate, comment, applyTemplate, clearComment, templates: REJECT_TEMPLATES }
}
