<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ROLE_LABELS } from '../constants/roles'
import { canEditOutput, canEditTemplates } from '../utils/permissions'

const auth = useAuthStore()
</script>
<template>
  <div class="layout">
    <header>
      <strong>加工厂月度评审管理</strong>
      <nav>
        <RouterLink to="/dashboard">首页</RouterLink>
        <RouterLink to="/factories">工厂</RouterLink>
        <RouterLink v-if="auth.role && canEditOutput(auth.role)" to="/monthly-output">产值录入</RouterLink>
        <RouterLink to="/kpi">KPI看板</RouterLink>
        <RouterLink v-if="auth.role && canEditTemplates(auth.role)" to="/admin/score-templates">评分模板</RouterLink>
        <RouterLink v-if="auth.role && canEditTemplates(auth.role)" to="/admin/users">用户</RouterLink>
      </nav>
      <span class="user">
        {{ auth.displayName }}（{{ auth.role ? ROLE_LABELS[auth.role] : '' }}）
        <button @click="auth.logout()">退出</button>
      </span>
    </header>
    <main><slot /></main>
  </div>
</template>
<style scoped>
.layout header {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.6rem 1rem; border-bottom: 1px solid #ddd; flex-wrap: wrap;
}
.layout nav { display: flex; gap: 0.75rem; flex: 1; }
.layout main { padding: 1rem; }
.user { display: flex; align-items: center; gap: 0.5rem; }
</style>
