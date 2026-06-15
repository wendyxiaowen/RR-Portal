<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { visibleCraft } from '../utils/permissions'
import type { Craft } from '../constants/roles'

const orders = useOrdersStore()
const auth = useAuthStore()

onMounted(() => orders.fetchAll())

const DEPTS: { craft: Craft; name: string; icon: string }[] = [
  { craft: 'injection', name: '注塑部', icon: '🧩' },
  { craft: 'painting', name: '喷油部', icon: '🎨' },
  { craft: 'assembly', name: '装配部', icon: '🔧' },
  { craft: 'sewing', name: '车缝部', icon: '🧵' },
]
const mine = computed(() => (auth.role ? visibleCraft(auth.role) : null))
const cards = computed(() =>
  DEPTS.filter((d) => !mine.value || d.craft === mine.value).map((d) => {
    const list = orders.items.filter((o) => o.expand?.factory?.craft === d.craft)
    return {
      ...d,
      count: list.length,
      ongoing: list.filter((o) => o.status !== 'delivered').length,
    }
  }),
)
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <h2 style="margin:0">下单明细</h2>
        <span class="muted">共 {{ orders.items.length }} 单 · {{ cards.length }} 个部门</span>
      </div>

      <div class="dept-grid">
        <RouterLink v-for="c in cards" :key="c.craft" class="dept-card" :to="`/orders/dept/${c.craft}`">
          <span class="ico">{{ c.icon }}</span>
          <div class="info">
            <span class="name">{{ c.name }}</span>
            <span class="sub">{{ c.count }} 单<span v-if="c.ongoing" class="ongoing"> · {{ c.ongoing }} 单进行中</span></span>
          </div>
          <span class="arrow">→</span>
        </RouterLink>
      </div>
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
.ongoing { color: var(--grade-b); font-weight: 600; }
.arrow { color: var(--text-faint); font-size: 1.2rem; }
</style>
