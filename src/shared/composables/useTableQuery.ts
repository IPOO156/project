import type { PaginatedData, PaginationParams } from '@/shared/types'
import { reactive } from 'vue'
import { usePagination } from './usePagination'

export function useTableQuery<T>(
  fetchFn: (params: PaginationParams) => Promise<PaginatedData<T> | T[]>,
  defaultForm: Record<string, unknown> = {},
) {
  const searchForm = reactive<Record<string, unknown>>({ ...defaultForm })
  const { loading, list, pagination, fetchData, resetPage } = usePagination<T>(fetchFn)

  async function handleSearch() {
    resetPage()
    await fetchData(searchForm)
  }

  async function handleReset() {
    Object.assign(searchForm, defaultForm)
    await handleSearch()
  }

  return {
    searchForm,
    loading,
    list,
    pagination,
    fetchData: (extra?: Record<string, unknown>) => fetchData({ ...searchForm, ...extra }),
    handleSearch,
    handleReset,
  }
}
