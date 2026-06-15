<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore } from '../stores/factories'
import { useScoresStore } from '../stores/scores'
import { useOutputStore } from '../stores/output'
import { useReviewsStore } from '../stores/reviews'
import { summarizeByCraft } from '../utils/summary'
import { CRAFT_LABELS, type Craft } from '../constants/roles'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const month = route.params.month as string
const factories = useFactoriesStore()
const scores = useScoresStore()
const output = useOutputStore()
const reviews = useReviewsStore()
const auth = useAuthStore()

onMounted(async () => {
  await Promise.all([factories.fetchAll(), scores.fetchByMonth(month), output.fetchByMonth(month)])
})
const summary = computed(() => summarizeByCraft(factories.items, scores.items, output.items))
const crafts = computed(() => Object.keys(summary.value) as Craft[])

async function saveSummary() {
  await reviews.save(month, { summary_by_craft: summary.value, summary_by: auth.userId ?? undefined })
  alert('大盘已存档')
}
</script>
<template>
  <AppLayout>
    <h2>月度评审大盘 — {{ month }}</h2>
    <table>
      <thead><tr><th>品类</th><th>工厂数</th><th>A</th><th>B</th><th>C</th><th>D</th><th>平均分</th><th>总产值</th></tr></thead>
      <tbody>
        <tr v-for="craft in crafts" :key="craft">
          <td>{{ CRAFT_LABELS[craft] }}</td>
          <td>{{ summary[craft].factory_count }}</td>
          <td>{{ summary[craft].grade_dist.A }}</td><td>{{ summary[craft].grade_dist.B }}</td>
          <td>{{ summary[craft].grade_dist.C }}</td><td>{{ summary[craft].grade_dist.D }}</td>
          <td>{{ summary[craft].avg_score }}</td><td>{{ summary[craft].total_output }}</td>
        </tr>
      </tbody>
    </table>
    <div class="actions">
      <button v-if="auth.role === 'sc_clerk' || auth.role === 'admin'" @click="saveSummary">存档大盘</button>
      <RouterLink :to="`/review/${month}/meeting`">→ 评审会议记录</RouterLink>
    </div>
  </AppLayout>
</template>
<style scoped>
table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: center; }
.actions { display: flex; gap: 1rem; align-items: center; margin-top: 1rem; }
</style>
