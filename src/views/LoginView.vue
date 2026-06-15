<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = '登录失败：' + (e?.message ?? '账号或密码错误')
  }
}
</script>

<template>
  <div class="login">
    <h1>加工厂月度评审管理</h1>
    <form @submit.prevent="onSubmit">
      <input v-model="email" type="email" placeholder="邮箱" required />
      <input v-model="password" type="password" placeholder="密码" required />
      <button type="submit">登录</button>
      <p v-if="error" class="err">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.login { max-width: 320px; margin: 12vh auto; text-align: center; }
.login h1 { font-size: 1.3rem; margin-bottom: 1.5rem; }
.login form { display: flex; flex-direction: column; gap: 0.75rem; }
.login input, .login button { padding: 0.6rem; font-size: 1rem; }
.err { color: #c0392b; }
</style>
