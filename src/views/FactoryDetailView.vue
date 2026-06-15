<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import FactoryForm from '../components/FactoryForm.vue'
import { useFactoriesStore } from '../stores/factories'
import { useIncidentsStore } from '../stores/incidents'
import { useAuthStore } from '../stores/auth'
import type { Factory, FactoryStatus } from '../types/factory'

const route = useRoute()
const router = useRouter()
const store = useFactoriesStore()
const incidents = useIncidentsStore()
const auth = useAuthStore()

const isNew = route.path.endsWith('/new')
const factory = ref<Partial<Factory>>({})
const newStatus = ref<FactoryStatus>('active')

const photoInput = ref<HTMLInputElement | null>(null)
const inc = ref<{ incident_date: string; incident_type: string; description: string }>({
  incident_date: '', incident_type: 'batch_defect', description: '',
})
const incidentTypeLabel: Record<string, string> = {
  batch_defect: '批量不良', env_violation: '环保违规', shutdown: '停工', other: '其他',
}

const statusLabel: Record<string, string> = {
  active: '正常', limited: '限单', suspended: '暂停', eliminated: '淘汰',
}

onMounted(async () => {
  if (!isNew) {
    factory.value = await store.get(route.params.id as string)
    await incidents.fetchByFactory(route.params.id as string)
  }
})

async function submitIncident() {
  const fd = new FormData()
  fd.append('factory', route.params.id as string)
  fd.append('incident_date', inc.value.incident_date)
  fd.append('incident_type', inc.value.incident_type)
  fd.append('description', inc.value.description)
  fd.append('status', 'open')
  fd.append('entered_by', auth.userId ?? '')
  const files = photoInput.value?.files
  if (files) for (const f of Array.from(files)) fd.append('photos', f)
  await incidents.create(fd)
  await incidents.fetchByFactory(route.params.id as string)
}

async function onSave(fd: FormData) {
  if (isNew) {
    fd.append('status', 'active')
    if (auth.userId) fd.append('created_by', auth.userId)
    const created = await store.create(fd)
    router.push(`/factories/${created.id}`)
  } else {
    await store.update(route.params.id as string, fd)
    factory.value = await store.get(route.params.id as string)
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
    <div class="page detail">
    <h2>{{ isNew ? '新增工厂' : factory.name }}</h2>
    <section class="card"><FactoryForm :model-value="factory" @save="onSave" /></section>

    <section v-if="!isNew" class="card status-box">
      <h3>合作状态</h3>
      <p>
        当前：<span class="badge" :class="'status-' + factory.status">{{ factory.status ? statusLabel[factory.status] : '-' }}</span>
        <span class="muted" style="margin-left:1rem">待审批：{{ factory.status_pending ? statusLabel[factory.status_pending] : '无' }}</span>
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

    <section v-if="!isNew" class="card incidents">
      <h3>异常 / 事故记录</h3>
      <form class="inc-form" @submit.prevent="submitIncident">
        <input v-model="inc.incident_date" type="date" required />
        <select v-model="inc.incident_type" required>
          <option value="batch_defect">批量不良</option>
          <option value="env_violation">环保违规</option>
          <option value="shutdown">停工</option>
          <option value="other">其他</option>
        </select>
        <input v-model="inc.description" placeholder="描述" />
        <input ref="photoInput" type="file" multiple accept="image/*" />
        <button type="submit">登记异常</button>
      </form>
      <ul>
        <li v-for="i in incidents.items" :key="i.id">
          {{ i.incident_date }} - {{ incidentTypeLabel[i.incident_type] }} - {{ i.status === 'open' ? '未关闭' : '已关闭' }}
        </li>
      </ul>
    </section>
    </div>
  </AppLayout>
</template>
<style scoped>
.detail { display: flex; flex-direction: column; gap: 1.25rem; }
.inc-form { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; margin-bottom: .75rem; }
.incidents ul { margin: 0; padding-left: 1.1rem; }
.incidents li { margin: .3rem 0; }
</style>
