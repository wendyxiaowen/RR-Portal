<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import FactoryForm from '../components/FactoryForm.vue'
import { useFactoriesStore } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import type { Factory, FactoryStatus } from '../types/factory'

const route = useRoute()
const router = useRouter()
const store = useFactoriesStore()
const auth = useAuthStore()

const isNew = route.path.endsWith('/new')
const factory = ref<Partial<Factory>>({})
const newStatus = ref<FactoryStatus>('active')

const statusLabel: Record<string, string> = {
  active: '正常', limited: '限单', suspended: '暂停', eliminated: '淘汰',
}

onMounted(async () => {
  if (!isNew) factory.value = await store.get(route.params.id as string)
})

async function onSave(data: Partial<Factory>) {
  if (isNew) {
    const created = await store.create({ ...data, created_by: auth.userId ?? undefined })
    router.push(`/factories/${created.id}`)
  } else {
    await store.update(route.params.id as string, data)
    factory.value = { ...factory.value, ...data }
  }
}

async function proposeStatus() {
  await store.update(route.params.id as string, { status: newStatus.value })
  factory.value = await store.get(route.params.id as string)
}
async function approveStatus() {
  await store.update(route.params.id as string, {
    status: newStatus.value, status_pending: '',
    status_updated_by: auth.userId ?? undefined,
    status_updated_at: new Date().toISOString(),
  })
  factory.value = await store.get(route.params.id as string)
}
</script>
<template>
  <AppLayout>
    <h2>{{ isNew ? '新增工厂' : factory.name }}</h2>
    <FactoryForm :model-value="factory" @save="onSave" />

    <section v-if="!isNew" class="status-box">
      <h3>合作状态</h3>
      <p>
        当前：{{ factory.status ? statusLabel[factory.status] : '-' }}
        待审批：{{ factory.status_pending ? statusLabel[factory.status_pending] : '无' }}
      </p>
      <div v-if="auth.role === 'sc_manager' || auth.role === 'admin'">
        <label>审批为
          <select v-model="newStatus">
            <option value="active">正常</option>
            <option value="limited">限单</option>
            <option value="suspended">暂停</option>
            <option value="eliminated">淘汰</option>
          </select>
        </label>
        <button @click="approveStatus">确认审批</button>
      </div>
      <div v-else>
        <label>提报变更
          <select v-model="newStatus">
            <option value="active">正常</option>
            <option value="limited">限单</option>
            <option value="suspended">暂停</option>
            <option value="eliminated">淘汰</option>
          </select>
        </label>
        <button @click="proposeStatus">提报</button>
      </div>
    </section>
  </AppLayout>
</template>
<style scoped>
.status-box { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee; }
</style>
