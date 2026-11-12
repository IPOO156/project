import type { PaginatedData, PaginationParams } from '@/shared/types/types'
import { computed, reactive } from 'vue'
import { usePagination } from './usePagination'

export function useTableQuery<T>(
  fetchFn: (params: PaginationParams) => Promise<PaginatedData<T> | T[]>,
  defaultForm: Record<string, unknown> = {},
) {
  const searchForm = reactive<Record<string, unknown>>({ ...defaultForm })
  const {
    loading,
    list,
    pagination: rawPagination,
    fetchData: request,
    resetPage,
    pageNum,
    pageSize,
  } = usePagination<T>(fetchFn)

  function fetchData(extra?: Record<string, unknown>) {
    return request({ ...searchForm, ...extra })
  }

  async function handleSearch() {
    resetPage()
    await fetchData()
  }

  async function handleReset() {
    Object.assign(searchForm, defaultForm)
    await handleSearch()
  }

  /**
   * 翻页 / 改每页条数同样要带上当前筛选条件。
   * usePagination 内部的 onChange 只带分页参数，这里用同一份 searchForm 重新拼一次，
   * 避免「先搜索再翻页」时筛选条件丢失。
   */
  const pagination = computed(() => ({
    ...rawPagination.value,
    onChange: (page: number) => {
      pageNum.value = page
      void fetchData()
    },
    onPageSizeChange: (size: number) => {
      pageSize.value = size
      pageNum.value = 1
      void fetchData()
    },
  }))

  return {
    searchForm,
    loading,
    list,
    pagination,
    fetchData,
    handleSearch,
    handleReset,
  }
}
