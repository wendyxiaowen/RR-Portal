<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '../../components/AppLayout.vue'
import { pb } from '../../pb'
import { ROLE_LABELS, CRAFT_LABELS, type Role, type Craft } from '../../constants/roles'

const users = ref<any[]>([])
const draft = ref<{ email: string; password: string; display_name: string; role: Role; craft: string }>({
  email: '', password: '', display_name: '', role: 'buyer_injection', craft: '',
})

async function load() {
  users.value = await pb.collection('users').getFullList({ sort: 'role' })
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
    verified: true,
  })
  await load()
}
</script>
<template>
  <AppLayout>
    <h2>用户管理</h2>
    <table>
      <thead><tr><th>姓名</th><th>邮箱</th><th>角色</th><th>工艺</th></tr></thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>{{ u.display_name }}</td><td>{{ u.email }}</td>
          <td>{{ ROLE_LABELS[u.role as Role] }}</td>
          <td>{{ u.craft ? CRAFT_LABELS[u.craft as Craft] : '-' }}</td>
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
        <option value="">无工艺</option>
        <option v-for="(label, key) in CRAFT_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <button type="submit">创建</button>
    </form>
  </AppLayout>
</template>
<style scoped>
table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; }
.user-form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
</style>
