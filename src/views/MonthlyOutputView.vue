<script setup lang="ts">
import { ref, computed } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore } from '../stores/factories'
import { useOutputStore } from '../stores/output'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { CRAFT_LABELS } from '../constants/roles'

const month = ref(new Date().toISOString().slice(0, 7))
const factories = useFactoriesStore()
const output = useOutputStore()
const orders = useOrdersStore()
const auth = useAuthStore()
const drafts = ref<Record<string, { source_doc?: string }>>({})

// 各工厂当月产值 = 下单明细中 order_date 落在所选月份的订单金额之和（只读，自动汇总）
const outputByFactory = computed(() => {
  const map: Record<string, number> = {}
  for (const o of orders.items) {
    if (!o.order_date || o.order_date.slice(0, 7) !== month.value) continue
    map[o.factory] = (map[o.factory] ?? 0) + (Number(o.amount) || 0)
  }
  return map
})

async function load() {
  await Promise.all([factories.fetchAll(), output.fetchByMonth(month.value), orders.fetchAll()])
  drafts.value = {}
  const existing = new Map(output.items.map((o) => [o.factory, o]))
  for (const f of factories.items) {
    drafts.value[f.id] = { source_doc: existing.get(f.id)?.source_doc }
  }
}
load()

async function save(factoryId: string) {
  await output.upsert({
    factory: factoryId,
    year_month: month.value,
    monthly_amount: outputByFactory.value[factoryId] ?? 0, // 自动取订单合计
    source_doc: drafts.value[factoryId]?.source_doc,
    entered_by: auth.userId ?? undefined,
    entered_at: new Date().toISOString(),
  })
  await output.fetchByMonth(month.value)
}
</script>
<template>
  <AppLayout>
    <div class="page">
    <h2>月度产值录入</h2>
    <div class="toolbar">
      <label>月份 <input v-model="month" type="month" @change="load" /></label>
      <button @click="load">加载</button>
      <span class="muted">当月产值由「下单明细」订单金额自动汇总，不可手动修改</span>
    </div>
    <table>
      <thead><tr><th>工厂</th><th>部门</th><th>当月产值（订单金额汇总）</th><th>对账单号</th><th></th></tr></thead>
      <tbody>
        <tr v-for="f in factories.items" :key="f.id">
          <td>{{ f.name }}</td>
          <td class="muted">{{ CRAFT_LABELS[f.craft] }}</td>
          <td><span class="amount">{{ (outputByFactory[f.id] ?? 0).toLocaleString() }}</span></td>
          <td><input v-model="(drafts[f.id] ??= {}).source_doc" placeholder="对账单号" /></td>
          <td><button @click="save(f.id)">保存</button></td>
        </tr>
      </tbody>
    </table>
    </div>
  </AppLayout>
</template>
<style scoped>
.amount { font-weight: 600; font-size: 1rem; }
</style>
