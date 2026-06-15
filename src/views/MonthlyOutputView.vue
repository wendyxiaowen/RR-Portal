<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore } from '../stores/factories'
import { useOutputStore } from '../stores/output'
import { useAuthStore } from '../stores/auth'

const month = ref(new Date().toISOString().slice(0, 7))
const factories = useFactoriesStore()
const output = useOutputStore()
const auth = useAuthStore()
const drafts = ref<Record<string, { monthly_amount?: number; source_doc?: string }>>({})

async function load() {
  await factories.fetchAll()
  await output.fetchByMonth(month.value)
  // 预填已有数据
  for (const o of output.items) {
    drafts.value[o.factory] = { monthly_amount: o.monthly_amount, source_doc: o.source_doc }
  }
}
load()

async function save(factoryId: string) {
  const d = drafts.value[factoryId] || {}
  await output.upsert({
    factory: factoryId,
    year_month: month.value,
    monthly_amount: d.monthly_amount,
    source_doc: d.source_doc,
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
    </div>
    <table>
      <thead><tr><th>工厂</th><th>当月产值</th><th>对账单号</th><th></th></tr></thead>
      <tbody>
        <tr v-for="f in factories.items" :key="f.id">
          <td>{{ f.name }}</td>
          <td><input type="number" v-model.number="(drafts[f.id] ??= {}).monthly_amount" /></td>
          <td><input v-model="(drafts[f.id] ??= {}).source_doc" /></td>
          <td><button @click="save(f.id)">保存</button></td>
        </tr>
      </tbody>
    </table>
    </div>
  </AppLayout>
</template>
