import { reactive } from 'vue'
import { usePagination } from './usePagination'

/**
 * 统一表格查询 Composable
 * 整合 searchForm + pagination + loading + list
 */
export function useTableQuery(
  fetchFn: (params: any) => Promise<any>,
  defaultForm: Record<string, any> = {},
) {
  const searchForm = reactive<Record<string, any>>({ ...defaultForm })
  const { loading, list, pagination, fetchData, resetPage } = usePagination(fetchFn)

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
    fetchData: (extra?: Record<string, any>) => fetchData({ ...searchForm, ...extra }),
    handleSearch,
    handleReset,
  }
}
