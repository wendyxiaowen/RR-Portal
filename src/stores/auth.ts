import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '../pb'
import type { Role, Craft } from '../constants/roles'
import { setPermissionOverrides } from '../utils/permissions'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(pb.authStore.record?.id ?? null)
  const role = ref<Role | null>((pb.authStore.record?.role as Role) ?? null)
  const craft = ref<Craft | null>((pb.authStore.record?.craft as Craft) ?? null)
  const displayName = ref<string>(pb.authStore.record?.display_name ?? '')
  // 初始注入当前用户的权限覆盖项
  setPermissionOverrides((pb.authStore.record?.permissions as Record<string, boolean>) ?? null)

  const isLoggedIn = computed(() => !!userId.value)

  function sync() {
    const rec = pb.authStore.record
    userId.value = rec?.id ?? null
    role.value = (rec?.role as Role) ?? null
    craft.value = (rec?.craft as Craft) ?? null
    displayName.value = rec?.display_name ?? ''
    setPermissionOverrides((rec?.permissions as Record<string, boolean>) ?? null)
  }

  async function login(email: string, password: string) {
    await pb.collection('users').authWithPassword(email, password)
    sync()
  }
  function logout() {
    pb.authStore.clear()
    sync()
  }
  return { userId, role, craft, displayName, isLoggedIn, login, logout, sync }
})
