<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useOrdersStore } from '../stores/orders'
import { useFactoriesStore } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import { CRAFT_LABELS, type Craft } from '../constants/roles'
import type { Order } from '../types/order'

const route = useRoute()
const router = useRouter()
const orders = useOrdersStore()
const factories = useFactoriesStore()
const auth = useAuthStore()

const craft = computed(() => route.params.craft as Craft)
const deptName = computed(() => CRAFT_LABELS[craft.value] ?? '部门')
const backTo = computed(() => `/orders/dept/${craft.value}`)

const draft = ref<Partial<Order>>({ status: 'placed' })
const deptFactories = computed(() => factories.items.filter((f) => f.craft === craft.value))
const draftAmount = computed(() => (Number(draft.value.quantity) || 0) * (Number(draft.value.unit_price) || 0))

onMounted(() => factories.fetchAll())

async function submit() {
  if (!draft.value.factory || !draft.value.product) return
  await orders.create({ ...draft.value, amount: draftAmount.value, created_by: auth.userId ?? undefined })
  router.push(backTo.value)
}
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <RouterLink :to="backTo" class="back">← 返回</RouterLink>
        <h2 style="margin:0">{{ deptName }} · 新增下单</h2>
      </div>
      <section class="card">
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
          <label>次品率(%) <input v-model.number="draft.defect_rate" type="number" min="0" step="0.1" /></label>
          <label>下单日期 <input v-model="draft.order_date" type="date" /></label>
          <label>交货日期 <input v-model="draft.delivery_date" type="date" /></label>
          <label>备注 <input v-model="draft.notes" placeholder="可选" /></label>
          <div class="actions">
            <button type="submit">提交下单</button>
            <RouterLink :to="backTo"><button type="button" class="ghost">取消</button></RouterLink>
          </div>
        </form>
      </section>
    </div>
  </AppLayout>
</template>
<style scoped>
.back { font-size: .9rem; }
.order-form { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 760px; }
.order-form label { display: flex; flex-direction: column; gap: .3rem; }
.actions { grid-column: 1 / -1; display: flex; gap: .75rem; margin-top: .5rem; }
</style>
