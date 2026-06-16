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
// 部门定义（底层值仍是 craft）
const DEPTS: { craft: Craft; name: string; icon: string }[] = [
  { craft: 'injection', name: '注塑部', icon: '🧩' },
  { craft: 'painting', name: '喷油部', icon: '🎨' },
  { craft: 'assembly', name: '装配部', icon: '🔧' },
  { craft: 'sewing', name: '车缝部', icon: '🧵' },
]
const cards = computed(() =>
  DEPTS.map((d) => {
    const list = visible.value.filter((f: Factory) => f.craft === d.craft)
    return {
      ...d,
      count: list.length,
      warn: list.filter((f) => f.status === 'limited' || f.status === 'suspended' || f.status === 'eliminated').length,
    }
  }).filter((c) => c.count > 0),
)
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <h2 style="margin:0">工厂信息管理</h2>
        <span class="muted">共 {{ visible.length }} 家 · {{ cards.length }} 个部门</span>
        <span class="spacer"></span>
        <RouterLink to="/factories/new"><button>+ 新增工厂</button></RouterLink>
      </div>

      <div class="dept-grid">
        <RouterLink v-for="c in cards" :key="c.craft" class="dept-card" :to="`/factories/dept/${c.craft}`">
          <span class="ico">{{ c.icon }}</span>
          <div class="info">
            <span class="name">{{ c.name }}</span>
            <span class="sub">{{ c.count }} 家工厂<span v-if="c.warn" class="warn"> · {{ c.warn }} 家预警</span></span>
          </div>
          <span class="arrow">→</span>
        </RouterLink>
      </div>

      <p v-if="!cards.length" class="hint">暂无工厂数据</p>
    </div>
  </AppLayout>
</template>
<style scoped>
.dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.dept-card {
  display: flex; align-items: center; gap: 1rem; text-decoration: none; color: var(--text);
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.25rem 1.4rem; box-shadow: var(--shadow); transition: all .15s ease;
}
.dept-card:hover {
  border-color: var(--primary-border); transform: translateY(-2px);
  box-shadow: 0 10px 24px -12px rgba(79,70,229,.45); text-decoration: none;
}
.ico { width: 52px; height: 52px; display: grid; place-items: center; font-size: 1.6rem; background: var(--primary-soft); border-radius: 14px; }
.info { display: flex; flex-direction: column; flex: 1; }
.name { font-size: 1.1rem; font-weight: 600; }
.sub { font-size: .85rem; color: var(--text-soft); }
.warn { color: var(--grade-c); font-weight: 600; }
.arrow { color: var(--text-faint); font-size: 1.2rem; }
</style>
