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
      <span class="user">
        {{ auth.displayName }}（{{ auth.role ? ROLE_LABELS[auth.role] : '' }}）
        <button @click="auth.logout()">退出</button>
      </span>
    </header>
    <div class="body">
      <aside>
        <nav>
          <RouterLink to="/dashboard">首页</RouterLink>
          <RouterLink to="/factories">工厂信息管理</RouterLink>
          <RouterLink to="/orders">下单明细</RouterLink>
          <RouterLink v-if="auth.role && canEditOutput(auth.role)" to="/monthly-output">产值录入</RouterLink>
          <RouterLink to="/kpi">KPI看板</RouterLink>
          <RouterLink v-if="auth.role && canEditTemplates(auth.role)" to="/admin/score-templates">评分模板</RouterLink>
          <RouterLink v-if="auth.role && canEditTemplates(auth.role)" to="/admin/users">用户</RouterLink>
        </nav>
      </aside>
      <main><slot /></main>
    </div>
  </div>
</template>
<style scoped>
.layout { min-height: 100vh; display: flex; flex-direction: column; }
.layout header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.75rem 1.5rem; background: #fff; border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 10;
}
.layout header strong { font-size: 1.05rem; color: var(--text); }
.body { display: flex; align-items: stretch; flex: 1; }
aside {
  width: 180px; flex-shrink: 0; background: #fff;
  border-right: 1px solid var(--border); padding: 1rem 0.75rem;
}
aside nav { display: flex; flex-direction: column; gap: 0.25rem; position: sticky; top: 4.5rem; }
aside nav a {
  padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); text-decoration: none;
  color: var(--text-soft); font-weight: 500; transition: all .15s ease;
}
aside nav a:hover { background: #f3f4f6; color: var(--text); text-decoration: none; }
aside nav a.router-link-active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
.layout main { flex: 1; padding: 1.5rem; min-width: 0; }
.user { display: flex; align-items: center; gap: 0.6rem; color: var(--text-soft); font-size: .9rem; }
.user button { padding: .35rem .7rem; font-size: .85rem; }
</style>
