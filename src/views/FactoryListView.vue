<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore, filterByCraft } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import { visibleCraft } from '../utils/permissions'
import { CRAFT_LABELS } from '../constants/roles'

const store = useFactoriesStore()
const auth = useAuthStore()

onMounted(() => store.fetchAll())

const visible = computed(() =>
  filterByCraft(store.items, auth.role ? visibleCraft(auth.role) : null),
)
const statusLabel: Record<string, string> = {
  active: '正常', limited: '限单', suspended: '暂停', eliminated: '淘汰',
}
</script>
<template>
  <AppLayout>
    <h2>工厂列表（{{ visible.length }}）</h2>
    <RouterLink to="/factories/new">+ 新增工厂</RouterLink>
    <table>
      <thead><tr><th>名称</th><th>工艺</th><th>状态</th><th></th></tr></thead>
      <tbody>
        <tr v-for="f in visible" :key="f.id">
          <td>{{ f.name }}</td>
          <td>{{ CRAFT_LABELS[f.craft] }}</td>
          <td>{{ statusLabel[f.status] }}</td>
          <td><RouterLink :to="`/factories/${f.id}`">详情</RouterLink></td>
        </tr>
      </tbody>
    </table>
  </AppLayout>
</template>
<style scoped>
table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; }
</style>
