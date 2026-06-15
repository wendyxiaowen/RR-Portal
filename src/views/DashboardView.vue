<script setup lang="ts">
import AppLayout from '../components/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>
<template>
  <AppLayout>
    <h2>首页</h2>
    <p>欢迎，{{ auth.displayName }}。本月待办与进度将在此显示。</p>
  </AppLayout>
</template>
