<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import { CRAFT_LABELS, type Craft } from '../constants/roles'
import type { Factory } from '../types/factory'

const route = useRoute()
const store = useFactoriesStore()
const auth = useAuthStore()
const craft = computed(() => route.params.craft as Craft)
const deptName = computed(() => CRAFT_LABELS[craft.value] ?? '部门')
const canDelete = computed(() => auth.role === 'admin')

onMounted(() => store.fetchAll())

const list = computed(() => store.items.filter((f: Factory) => f.craft === craft.value))
const statusLabel: Record<string, string> = {
  active: '正常', limited: '限单', suspended: '暂停', eliminated: '淘汰',
}

async function remove(f: Factory) {
  if (!confirm(`确定删除工厂「${f.name}」？此操作不可恢复。`)) return
  try {
    await store.remove(f.id)
    await store.fetchAll()
  } catch (e: any) {
    alert('删除失败：' + (e?.message ?? ''))
  }
}
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <RouterLink to="/factories" class="back">← 部门</RouterLink>
        <h2 style="margin:0">{{ deptName }}</h2>
        <span class="muted">共 {{ list.length }} 家</span>
        <span class="spacer"></span>
        <RouterLink to="/factories/new"><button>+ 新增工厂</button></RouterLink>
      </div>
      <table>
        <thead><tr><th>名称</th><th>联系人</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="f in list" :key="f.id">
            <td>{{ f.name }}</td>
            <td>{{ f.contact_person || '-' }}</td>
            <td><span class="badge" :class="'status-' + f.status">{{ statusLabel[f.status] }}</span></td>
            <td>
              <div class="ops">
                <RouterLink :to="`/factories/${f.id}`"><button class="ghost mini">编辑</button></RouterLink>
                <button v-if="canDelete" class="mini danger" @click="remove(f)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!list.length" class="hint">该部门暂无工厂</p>
    </div>
  </AppLayout>
</template>
<style scoped>
.back { font-size: .9rem; }
.ops { display: flex; gap: .5rem; }
.mini { padding: .3rem .7rem; font-size: .82rem; }
.danger { background: var(--grade-d); border-color: var(--grade-d); }
.danger:hover { filter: brightness(1.07); }
</style>
