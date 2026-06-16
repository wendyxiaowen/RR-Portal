<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { pb } from '../../pb'
import { ROLE_LABELS, CRAFT_LABELS, type Role, type Craft } from '../../constants/roles'

const users = ref<any[]>([])
const emailEdits = ref<Record<string, string>>({})
const draft = ref<{ email: string; password: string; display_name: string; role: Role; craft: string }>({
  email: '', password: '', display_name: '', role: 'buyer_injection', craft: '',
})

async function load() {
  users.value = await pb.collection('users').getFullList({ sort: 'role' })
  emailEdits.value = {}
  for (const u of users.value) emailEdits.value[u.id] = u.email ?? ''
}
onMounted(load)

async function createUser() {
  await pb.collection('users').create({
    email: draft.value.email,
    password: draft.value.password,
    passwordConfirm: draft.value.password,
    display_name: draft.value.display_name,
    role: draft.value.role,
    craft: draft.value.craft || undefined,
    emailVisibility: true,
    verified: true,
  })
  draft.value = { email: '', password: '', display_name: '', role: 'buyer_injection', craft: '' }
  await load()
}

// 管理员改邮箱：走专用接口（superuser 上下文绕过邮箱保护）
async function saveEmail(u: any) {
  const email = emailEdits.value[u.id]?.trim()
  if (!email || email === u.email) return
  try {
    await pb.send('/api/admin/set-user-email', {
      method: 'POST',
      body: { userId: u.id, email },
    })
    await load()
    alert('邮箱已更新')
  } catch (e: any) {
    alert('更新失败：' + (e?.message ?? ''))
  }
}
</script>
<template>
  <AppLayout>
    <div class="page">
    <h2>用户管理</h2>
    <table>
      <thead><tr><th>姓名</th><th>邮箱（可编辑）</th><th>角色</th><th>部门</th><th></th></tr></thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.display_name }}</td>
          <td><input class="email-input" v-model="emailEdits[u.id]" type="email" /></td>
          <td>{{ ROLE_LABELS[u.role as Role] }}</td>
          <td>{{ u.craft ? CRAFT_LABELS[u.craft as Craft] : '-' }}</td>
          <td>
            <button class="ghost mini" :disabled="emailEdits[u.id] === u.email" @click="saveEmail(u)">保存邮箱</button>
          </td>
        </tr>
      </tbody>
    </table>
    <h3>新建用户</h3>
    <form class="user-form" @submit.prevent="createUser">
      <input v-model="draft.display_name" placeholder="姓名" required />
      <input v-model="draft.email" type="email" placeholder="邮箱" required />
      <input v-model="draft.password" type="password" placeholder="密码(≥8位)" required />
      <select v-model="draft.role">
        <option v-for="(label, key) in ROLE_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="draft.craft">
        <option value="">无部门</option>
        <option v-for="(label, key) in CRAFT_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <button type="submit">创建</button>
    </form>
    </div>
  </AppLayout>
</template>
<style scoped>
h3 { margin-top: 1.5rem; }
.user-form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; align-items: center; }
.email-input { width: 230px; padding: .3rem .5rem; font-size: .85rem; }
.mini { padding: .25rem .6rem; font-size: .8rem; }
</style>
