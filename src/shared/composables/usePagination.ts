import type { PaginatedData, PaginationParams } from '@/shared/types/types'
import { computed, ref } from 'vue'

export interface PaginationOptions<T> {
  fetchFn: (params: PaginationParams) => Promise<PaginatedData<T> | T[]>
  immediate?: boolean
}

export function usePagination<T>(
  fetchFn: (params: PaginationParams) => Promise<PaginatedData<T> | T[]>,
) {
  const pageNum = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const loading = ref(false)
  const list = ref<T[]>([])

  const pagination = computed(() => ({
    currentPage: pageNum.value,
    pageSize: pageSize.value,
    total: total.value,
    onChange: (page: number) => {
      pageNum.value = page
      fetchData()
    },
    onPageSizeChange: (size: number) => {
      pageSize.value = size
      pageNum.value = 1
      fetchData()
    },
  }))

  async function fetchData(extraParams?: Record<string, unknown>) {
    loading.value = true
    try {
      const res = await fetchFn({
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        ...extraParams,
      })
      if (Array.isArray(res)) {
        list.value = res
        total.value = res.length
      } else {
        list.value = res.list ?? []
        total.value = res.total ?? 0
      }
      return res
    } finally {
      loading.value = false
    }
  }

  function resetPage() {
    pageNum.value = 1
  }

  return { pageNum, pageSize, total, loading, list, pagination, fetchData, resetPage }
}
