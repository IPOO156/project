import type { Ref } from 'vue'
/**
 * useFormRecords - 表单提交记录管理
 *
 * 统一管理各申报/报名类型的提交记录，支持 add/edit/remove/view。
 * 列表数据源为 GET /activities（6.1 动态记录），按 archiveType 过滤出当前类型；
 * 接口异常时保持空列表（不填充假数据），提交成功后由调用方触发 loadRecords 刷新真实记录。
 */
import { ref } from 'vue'
import { getActivities } from '@/shared/api/activities'
import { ARCHIVE_TYPE_ALIASES, deriveRecordTitle, STATUS_MAP } from '@/shared/api/submission'

/** 本地草稿记录的统一 id（草稿仅本地持久化，无后端草稿接口） */
export const DRAFT_LOCAL_ID = 'draft-local'

/** 通用提交记录（无状态，学生自主管理） */
export interface FormRecord {
  id: string
  type: string
  typeLabel: string
  title: string
  submitDate: string
  semester: string
  status?: string
  [key: string]: any
}

const semesters = ['2023-2024-1', '2023-2024-2', '2024-2025-1', '2024-2025-2']

function genId(): string {
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 各类型的中文名称 */
const TYPE_LABELS: Record<string, string> = {
  competition: '学科竞赛',
  innovation: '创新创业',
  research: '学术研究',
  scholarship: '奖学金',
  certificate: '荣誉证书',
  internship: '实习经历',
  organization: '组织履历',
  training: '实训项目',
  socialPractice: '社会实践',
  bookReport: '图书心得',
  competitionStar: '竞赛之星报名',
  innovationStar: '双创之星报名',
  scientificProject: '科研项目',
  softwareCopyright: '软件著作权',
  paper: '发表论文',
}

/** 判断本地草稿是否含有效内容（学期/空附件不算） */
function isNonEmptyDraft(data: Record<string, unknown>): boolean {
  return Object.entries(data).some(([k, v]) => {
    if (k === 'semester' || k === 'proofMaterials') return false
    if (v === undefined || v === null || v === '') return false
    if (Array.isArray(v) && v.length === 0) return false
    return true
  })
}

/**
 * 管理指定类型的提交记录
 * @param type 类型 key（与后端 /activities 的 archiveType 一致）
 * @param draftStorageKey 本地草稿 localStorage key（'form_draft_'+draftKey）；后端无草稿接口，
 *        草稿仅本地持久化，列表将本地草稿与真实记录合并展示，保证刷新后草稿仍可见
 */
export function useFormRecords(type: string, draftStorageKey?: string) {
  const label = TYPE_LABELS[type] || type
  const records: Ref<FormRecord[]> = ref([])

  /** 读取当前类型本地草稿并构造成一条草稿记录（字段一并带上，便于编辑回填） */
  function readLocalDraft(): FormRecord | null {
    if (!draftStorageKey) return null
    try {
      const raw = localStorage.getItem(draftStorageKey)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (!isNonEmptyDraft(data)) return null
      return {
        id: DRAFT_LOCAL_ID,
        type,
        typeLabel: label,
        title: deriveRecordTitle(data) || `${label}草稿`,
        submitDate: '',
        semester: (data as any).semester || '',
        status: 'draft',
        ...data,
      }
    } catch {
      return null
    }
  }

  /** 从 GET /activities（6.1）拉取该类型真实申报记录 + 合并本地草稿；拉取失败保持已有列表，不填充假数据 */
  async function loadRecords(): Promise<void> {
    try {
      const res = await getActivities({ page: 1, per_page: 200 })
      const list = res?.list ?? []
      // archive_type 与 type key 可能不一致（如学科竞赛为 academic_competition），按别名兼容匹配。
      // 后端实际字段为下划线（archive_type/submit_time/semester_name），驼峰仅为兼容别名。
      const aliases = ARCHIVE_TYPE_ALIASES[type] ?? []
      const accepted = new Set([type, ...aliases])
      const real = list
        .filter((a) => accepted.has(a.archive_type ?? a.archiveType ?? ''))
        .map((a) => ({
          ...a,
          id: String(a.id),
          type,
          typeLabel: a.archive_type_label ?? a.archiveTypeLabel ?? label,
          title: a.title || a.content || '',
          submitDate: ((a.submit_time ?? a.submitTime) || '').slice(0, 10),
          semester: a.semester_name ?? a.semesterName ?? '',
          status: STATUS_MAP[a.status] ?? 'pending',
        }))
      const draft = readLocalDraft()
      records.value = draft ? [draft, ...real] : real
    } catch {
      // 拉取失败保持已有列表，避免提交成功瞬间网络抖动导致记录"消失"
    }
  }

  loadRecords()

  function addRecord(title: string, extra: Record<string, any> = {}) {
    records.value.unshift({
      id: genId(),
      type,
      typeLabel: label,
      title,
      submitDate: new Date().toISOString().slice(0, 10),
      semester: pick(semesters),
      ...extra,
    })
  }

  function updateRecord(id: string, data: Partial<FormRecord>) {
    const idx = records.value.findIndex((r) => r.id === id)
    if (idx > -1) {
      records.value[idx] = { ...records.value[idx], ...data }
    }
  }

  function removeRecord(id: string) {
    records.value = records.value.filter((r) => r.id !== id)
  }

  function getRecord(id: string): FormRecord | undefined {
    return records.value.find((r) => r.id === id)
  }

  return {
    records,
    loadRecords,
    addRecord,
    updateRecord,
    removeRecord,
    getRecord,
  }
}
