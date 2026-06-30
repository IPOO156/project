import { ref, computed } from 'vue'

export function usePagination(fetchFn: (params: any) => Promise<any>) {
  const pageNum = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const loading = ref(false)
  const list = ref<any[]>([])

  const pagination = computed(() => ({
    pageNum: pageNum.value,
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

  async function fetchData(extraParams?: Record<string, any>) {
    loading.value = true
    try {
      const res = await fetchFn({
        pageNum: pageNum.value,
        pageSize: pageSize.value,
        ...extraParams,
      })
      list.value = res.data?.list ?? res.data ?? []
      total.value = res.data?.total ?? 0
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
