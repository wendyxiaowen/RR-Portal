<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore, filterByCraft } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import { visibleCraft } from '../utils/permissions'
import type { Craft } from '../constants/roles'
import type { Factory } from '../types/factory'

const store = useFactoriesStore()
const auth = useAuthStore()

onMounted(() => store.fetchAll())

const visible = computed(() =>
  filterByCraft(store.items, auth.role ? visibleCraft(auth.role) : null),
)
const statusLabel: Record<string, string> = {
  active: '正常', limited: '限单', suspended: '暂停', eliminated: '淘汰',
}
// 部门（工艺）顺序与显示名
const DEPTS: { craft: Craft; name: string; icon: string }[] = [
  { craft: 'injection', name: '注塑部', icon: '🧩' },
  { craft: 'painting', name: '喷油部', icon: '🎨' },
  { craft: 'assembly', name: '装配部', icon: '🔧' },
  { craft: 'sewing', name: '车缝部', icon: '🧵' },
]
// 按部门分组，仅保留有工厂的部门
const groups = computed(() =>
  DEPTS.map((d) => ({ ...d, list: visible.value.filter((f: Factory) => f.craft === d.craft) }))
    .filter((g) => g.list.length > 0),
)
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <h2 style="margin:0">工厂列表</h2>
        <span class="muted">共 {{ visible.length }} 家 · {{ groups.length }} 个部门</span>
        <span class="spacer"></span>
        <RouterLink to="/factories/new"><button>+ 新增工厂</button></RouterLink>
      </div>

      <section v-for="g in groups" :key="g.craft" class="dept">
        <div class="dept-head">
          <span class="dept-ico">{{ g.icon }}</span>
          <h3>{{ g.name }}</h3>
          <span class="dept-cnt">{{ g.list.length }} 家</span>
        </div>
        <table>
          <thead><tr><th>名称</th><th>状态</th><th></th></tr></thead>
          <tbody>
            <tr v-for="f in g.list" :key="f.id">
              <td>{{ f.name }}</td>
              <td><span class="badge" :class="'status-' + f.status">{{ statusLabel[f.status] }}</span></td>
              <td><RouterLink :to="`/factories/${f.id}`">详情 →</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </section>

      <p v-if="!groups.length" class="hint">暂无工厂数据</p>
    </div>
  </AppLayout>
</template>
<style scoped>
.dept { margin-bottom: 1.5rem; }
.dept-head { display: flex; align-items: center; gap: .6rem; margin-bottom: .5rem; }
.dept-head h3 { margin: 0; }
.dept-ico {
  width: 32px; height: 32px; display: grid; place-items: center;
  background: var(--primary-soft); border-radius: 8px; font-size: 1.1rem;
}
.dept-cnt {
  font-size: .78rem; color: var(--primary); background: var(--primary-soft);
  padding: .1rem .55rem; border-radius: 999px; font-weight: 600;
}
</style>
