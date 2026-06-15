<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useOrdersStore } from '../stores/orders'
import { useFactoriesStore } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import { CRAFT_LABELS, type Craft } from '../constants/roles'
import type { Order, OrderStatus } from '../types/order'

const route = useRoute()
const orders = useOrdersStore()
const factories = useFactoriesStore()
const auth = useAuthStore()

const craft = computed(() => route.params.craft as Craft)
const deptName = computed(() => CRAFT_LABELS[craft.value] ?? '部门')

const statusFilter = ref<string>('')
const STATUS: { value: OrderStatus; label: string; cls: string }[] = [
  { value: 'placed', label: '已下单', cls: 'status-limited' },
  { value: 'producing', label: '生产中', cls: 'badge-B' },
  { value: 'delivered', label: '已交货', cls: 'status-active' },
  { value: 'cancelled', label: '已取消', cls: 'status-eliminated' },
]
const statusMeta = (s?: string) => STATUS.find((x) => x.value === s)

const draft = ref<Partial<Order>>({ status: 'placed' })

// 本部门工厂（下单可选）
const deptFactories = computed(() => factories.items.filter((f) => f.craft === craft.value))
// 本部门订单
const deptOrders = computed(() =>
  orders.items.filter((o) => o.expand?.factory?.craft === craft.value)
    .filter((o) => !statusFilter.value || o.status === statusFilter.value),
)

async function load() {
  await Promise.all([orders.fetchAll(), factories.fetchAll()])
}
onMounted(load)

// 金额自动 = 数量 × 单价
const draftAmount = computed(() => (Number(draft.value.quantity) || 0) * (Number(draft.value.unit_price) || 0))

async function submit() {
  if (!draft.value.factory || !draft.value.product) return
  await orders.create({ ...draft.value, amount: draftAmount.value, created_by: auth.userId ?? undefined })
  draft.value = { status: 'placed' }
  await load()
}
async function changeStatus(o: Order, ev: Event) {
  const v = (ev.target as HTMLSelectElement).value as OrderStatus
  await orders.update(o.id, { status: v })
  await load()
}
async function changeNotes(o: Order, ev: Event) {
  const v = (ev.target as HTMLInputElement).value
  await orders.update(o.id, { notes: v })
}
function factoryName(o: Order) { return o.expand?.factory?.name ?? '-' }
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <RouterLink to="/orders" class="back">← 部门</RouterLink>
        <h2 style="margin:0">{{ deptName }} · 下单明细</h2>
        <span class="muted">共 {{ deptOrders.length }} 单</span>
        <span class="spacer"></span>
        <label>状态
          <select v-model="statusFilter">
            <option value="">全部</option>
            <option v-for="s in STATUS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
      </div>

      <section class="card form-card">
        <h3>新增下单</h3>
        <form class="order-form" @submit.prevent="submit">
          <label>工厂
            <select v-model="draft.factory" required>
              <option disabled value="">选择工厂</option>
              <option v-for="f in deptFactories" :key="f.id" :value="f.id">{{ f.name }}</option>
            </select>
          </label>
          <label>工序 <input v-model="draft.process" placeholder="如注塑/喷油" /></label>
          <label>货号 <input v-model="draft.item_no" placeholder="货号" /></label>
          <label>产品 <input v-model="draft.product" placeholder="产品名称" required /></label>
          <label>数量 <input v-model.number="draft.quantity" type="number" min="0" /></label>
          <label>单价 <input v-model.number="draft.unit_price" type="number" min="0" step="0.01" /></label>
          <label>金额 <input :value="draftAmount" type="number" disabled /></label>
          <label>下单日期 <input v-model="draft.order_date" type="date" /></label>
          <label>交货日期 <input v-model="draft.delivery_date" type="date" /></label>
          <label>备注 <input v-model="draft.notes" placeholder="可选" /></label>
          <button type="submit">提交下单</button>
        </form>
      </section>

      <table>
        <thead><tr><th>工厂</th><th>工序</th><th>货号</th><th>产品</th><th>数量</th><th>单价</th><th>金额</th><th>下单日期</th><th>交货日期</th><th>状态</th><th>备注</th></tr></thead>
        <tbody>
          <tr v-for="o in deptOrders" :key="o.id">
            <td>{{ factoryName(o) }}</td>
            <td>{{ o.process || '-' }}</td>
            <td>{{ o.item_no || '-' }}</td>
            <td>{{ o.product }}</td>
            <td>{{ o.quantity ?? '-' }}</td>
            <td>{{ o.unit_price != null ? o.unit_price : '-' }}</td>
            <td>{{ o.amount != null ? o.amount.toLocaleString() : '-' }}</td>
            <td>{{ o.order_date ? o.order_date.slice(0,10) : '-' }}</td>
            <td>{{ o.delivery_date ? o.delivery_date.slice(0,10) : '-' }}</td>
            <td>
              <select class="status-sel" :class="statusMeta(o.status)?.cls"
                :value="o.status ?? 'placed'" @change="changeStatus(o, $event)">
                <option v-for="s in STATUS" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </td>
            <td>
              <input class="notes-input" :value="o.notes ?? ''" placeholder="备注" @change="changeNotes(o, $event)" />
            </td>
          </tr>
          <tr v-if="!deptOrders.length"><td colspan="11" class="hint" style="text-align:center">该部门暂无订单</td></tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>
<style scoped>
.back { font-size: .9rem; }
.form-card { margin-bottom: 1.25rem; }
.order-form { display: flex; gap: .75rem; flex-wrap: wrap; align-items: flex-end; }
.order-form label { display: flex; flex-direction: column; gap: .25rem; }
.status-sel { border: none; font-weight: 600; font-size: .82rem; padding: .2rem .5rem; border-radius: 999px; cursor: pointer; }
.notes-input { width: 100%; min-width: 120px; padding: .3rem .5rem; font-size: .85rem; }
</style>
