<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useOrdersStore } from '../stores/orders'
import { CRAFT_LABELS, type Craft } from '../constants/roles'
import type { Order, OrderStatus } from '../types/order'

const route = useRoute()
const orders = useOrdersStore()

const craft = computed(() => route.params.craft as Craft)
const deptName = computed(() => CRAFT_LABELS[craft.value] ?? '部门')

const statusFilter = ref<string>('')
const STATUS: { value: OrderStatus; label: string; cls: string }[] = [
  { value: 'placed', label: '已下单', cls: 'status-limited' },
  { value: 'producing', label: '生产中', cls: 'badge-B' },
  { value: 'delivered', label: '已交货', cls: 'status-active' },
  { value: 'cancelled', label: '已取消', cls: 'status-eliminated' },
  { value: 'returned', label: '退货', cls: 'flag-red' },
]
const statusMeta = (s?: string) => STATUS.find((x) => x.value === s)

// 本部门订单
const deptOrders = computed(() =>
  orders.items.filter((o) => o.expand?.factory?.craft === craft.value)
    .filter((o) => !statusFilter.value || o.status === statusFilter.value),
)

async function load() {
  await orders.fetchAll()
}
onMounted(load)

async function changeStatus(o: Order, ev: Event) {
  const v = (ev.target as HTMLSelectElement).value as OrderStatus
  await orders.update(o.id, { status: v })
  await load()
}
async function changeNotes(o: Order, ev: Event) {
  const v = (ev.target as HTMLInputElement).value
  await orders.update(o.id, { notes: v })
}
async function changeCurrentProduct(o: Order, ev: Event) {
  await orders.update(o.id, { current_product: (ev.target as HTMLInputElement).value })
}
async function changeProgress(o: Order, ev: Event) {
  const raw = (ev.target as HTMLInputElement).value
  await orders.update(o.id, { progress: raw === '' ? undefined : Number(raw) })
}
async function changeDelayed(o: Order, ev: Event) {
  await orders.update(o.id, { is_delayed: (ev.target as HTMLSelectElement).value === 'true' })
  await load()
}
async function changeDelayDays(o: Order, ev: Event) {
  const raw = (ev.target as HTMLInputElement).value
  await orders.update(o.id, { delay_days: raw === '' ? undefined : Number(raw) })
}
async function changeDelayReason(o: Order, ev: Event) {
  await orders.update(o.id, { delay_reason: (ev.target as HTMLInputElement).value })
}
function factoryName(o: Order) { return o.expand?.factory?.name ?? '-' }
</script>
<template>
  <AppLayout>
    <div class="page wide">
      <div class="toolbar">
        <RouterLink to="/orders" class="back">← 部门</RouterLink>
        <h2 style="margin:0">{{ deptName }} · 下单明细</h2>
        <span class="muted">共 {{ deptOrders.length }} 单</span>
        <RouterLink :to="`/orders/dept/${craft}/new`"><button>+ 新增下单</button></RouterLink>
        <span class="spacer"></span>
        <label>状态
          <select v-model="statusFilter">
            <option value="">全部</option>
            <option v-for="s in STATUS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
      </div>

      <table>
        <thead><tr><th>工厂</th><th>工序</th><th>货号</th><th>产品</th><th>数量</th><th>单价</th><th>金额</th><th>下单日期</th><th>交货日期</th><th>当前在生产产品</th><th>生产完成进度</th><th>是否延期</th><th>延期天数</th><th>主要延期原因</th><th>状态</th><th>备注</th></tr></thead>
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
            <td><input class="cur-input" :value="o.current_product ?? ''" placeholder="产品" @change="changeCurrentProduct(o, $event)" /></td>
            <td>
              <span class="prog-cell">
                <input class="num-input" :value="o.progress ?? ''" type="number" min="0" max="100" placeholder="-" @change="changeProgress(o, $event)" /><span class="pct">%</span>
              </span>
            </td>
            <td>
              <select class="delay-sel" :value="String(o.is_delayed ?? false)" @change="changeDelayed(o, $event)">
                <option value="false">否</option>
                <option value="true">是</option>
              </select>
            </td>
            <td><input class="num-input" :value="o.delay_days ?? ''" type="number" min="0" placeholder="-" @change="changeDelayDays(o, $event)" /></td>
            <td><input class="reason-input" :value="o.delay_reason ?? ''" placeholder="原因" @change="changeDelayReason(o, $event)" /></td>
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
          <tr v-if="!deptOrders.length"><td colspan="16" class="hint" style="text-align:center">该部门暂无订单</td></tr>
        </tbody>
      </table>
    </div>
  </AppLayout>
</template>
<style scoped>
.wide { max-width: none; } /* 宽表铺满，避免左侧大片留白 */
.back { font-size: .9rem; }
.form-card { margin-bottom: 1.25rem; }
.order-form { display: flex; gap: .75rem; flex-wrap: wrap; align-items: flex-end; }
.order-form label { display: flex; flex-direction: column; gap: .25rem; }
.status-sel { border: none; font-weight: 600; font-size: .82rem; padding: .2rem .5rem; border-radius: 999px; cursor: pointer; }
.notes-input { width: 100%; min-width: 120px; padding: .3rem .5rem; font-size: .85rem; }
.delay-sel { padding: .25rem .4rem; font-size: .82rem; }
.num-input { width: 56px; padding: .3rem .4rem; font-size: .85rem; }
.reason-input { width: 120px; padding: .3rem .5rem; font-size: .85rem; }
.cur-input { width: 110px; padding: .3rem .5rem; font-size: .85rem; }
.prog-cell { display: inline-flex; align-items: center; gap: 2px; }
.pct { color: var(--text-soft); font-size: .82rem; }
</style>
