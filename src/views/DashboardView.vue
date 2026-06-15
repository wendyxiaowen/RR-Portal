<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useScoresStore } from '../stores/scores'
import { canEditOutput } from '../utils/permissions'

const auth = useAuthStore()
const scores = useScoresStore()
const month = ref(new Date().toISOString().slice(0, 7))

onMounted(() => scores.fetchByMonth(month.value))
const submitted = computed(() => scores.items.filter((s) => s.status !== 'draft').length)
</script>
<template>
  <AppLayout>
    <h2>首页 — {{ month }}</h2>
    <p>欢迎，{{ auth.displayName }}。</p>
    <ul>
      <li>本月已提交评分单：{{ submitted }} 份</li>
      <li v-if="auth.role && canEditOutput(auth.role)">
        <RouterLink to="/monthly-output">→ 录入本月产值（每月5日前）</RouterLink>
      </li>
      <li><RouterLink :to="`/review/${month}`">→ 查看本月评审大盘</RouterLink></li>
      <li><RouterLink to="/kpi">→ 岗位 KPI 看板</RouterLink></li>
    </ul>
  </AppLayout>
</template>
