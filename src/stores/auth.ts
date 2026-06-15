import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pb } from '../pb'
import type { Role, Craft } from '../constants/roles'

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<string | null>(pb.authStore.record?.id ?? null)
  const role = ref<Role | null>((pb.authStore.record?.role as Role) ?? null)
  const craft = ref<Craft | null>((pb.authStore.record?.craft as Craft) ?? null)
  const displayName = ref<string>(pb.authStore.record?.display_name ?? '')

  const isLoggedIn = computed(() => !!userId.value)

  function sync() {
    const rec = pb.authStore.record
    userId.value = rec?.id ?? null
    role.value = (rec?.role as Role) ?? null
    craft.value = (rec?.craft as Craft) ?? null
    displayName.value = rec?.display_name ?? ''
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
