import type { UserInfo } from '@/shared/types/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useTabsStore } from './tabs'

export const useUserStore = defineStore('user', () => {
  // state
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  // getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.realName ?? userInfo.value?.username ?? '')
  const studentId = computed(() => userInfo.value?.studentId ?? '')

  // actions
  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    // 登出时清理已访问 tab（防止跨账号污染）
    // tabsStore 必须延迟获取：避免 user store 初始化时 tabs store 未注册
    try {
      useTabsStore().clearAll()
    } catch {
      // tabs store 未注册（极少数场景）—— 静默降级
    }
  }

  return { token, userInfo, isLoggedIn, userName, studentId, setToken, setUserInfo, logout }
})
