<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import AppLayout from '../components/AppLayout.vue'
import { pb } from '../pb'
import { useOrdersStore } from '../stores/orders'
import { useFactoriesStore } from '../stores/factories'
import type { Order } from '../types/order'
import type { Factory } from '../types/factory'

const orders = useOrdersStore()
const factories = useFactoriesStore()
const factoryGrade = ref<Record<string, string>>({})

onMounted(async () => {
  await Promise.all([orders.fetchAll(), factories.fetchAll()])
  const scores = await pb.collection('monthly_scores').getFullList({ sort: '-year_month' })
  const g: Record<string, string> = {}
  for (const s of scores as any[]) { if (!(s.factory in g) && s.grade) g[s.factory] = s.grade }
  factoryGrade.value = g
})

const factoryById = computed(() => {
  const m: Record<string, Factory> = {}
  for (const f of factories.items) m[f.id] = f
  return m
})
function equipSummary(f?: Factory) {
  return (f?.equipment_list ?? []).map((e) => (e.qty ? `${e.type}×${e.qty}` : e.type)).join('，')
}
function passRate(o: Order): string {
  const n = Number(o.inspect_count) || 0
  if (n <= 0) return ''
  const bad = Number(o.defect_count) || 0
  return Math.round(((n - bad) / n) * 1000) / 10 + '%'
}

const rows = computed(() => orders.items.map((o) => ({ o, f: factoryById.value[o.factory], grade: factoryGrade.value[o.factory] ?? '' })))

async function rate(o: Order, ev: Event) {
  const raw = (ev.target as HTMLInputElement).value
  await orders.update(o.id, { manager_rating: raw === '' ? undefined : Number(raw) })
  await orders.fetchAll()
}

function exportExcel() {
  const headers = [
    '序号', '厂名', '联系人', '联系电话', '工厂地址', '设备台数/生产拉台', '帮我们生产的机台/生产线',
    '员工人数', '产能/年生意额(万)', '加工类型', '环评/消防/安监资质', '工厂评级(A/B/C/D)',
    '是否有延期', '延期天数', '主要延期原因',
    '来料抽检单数', '不良单数', '合格率', '是否已解决', '外发/品质巡查问题点',
    '当前在生产产品', '生产完成进度(%)', '经理评分(1-10分)', '备注',
  ]
  const groupRow = new Array(headers.length).fill('')
  groupRow[0] = '工厂基础信息（外发组+PMC负责）'
  groupRow[12] = '交期准时性（PMC负责）'
  groupRow[15] = '品质管理（QC负责）'
  groupRow[20] = '生产进度（生产/PMC/外发负责）'
  groupRow[22] = '综合评价'
  groupRow[23] = '备注'
  const body = rows.value.map((r, i) => {
    const { o, f, grade } = r
    return [
      i + 1, f?.name ?? '', f?.contact_person ?? '', f?.contact_phone ?? '', f?.address ?? '',
      equipSummary(f), f?.production_lines ?? '', f?.staff_count ?? '', f?.annual_revenue ?? '',
      f?.processable_types ?? '', f?.has_certs ? '是' : '否', grade,
      o.is_delayed ? '是' : '否', o.delay_days ?? '', o.delay_reason ?? '',
      o.inspect_count ?? '', o.defect_count ?? '', passRate(o), o.is_resolved ? '是' : '否', o.quality_issues ?? '',
      o.current_product ?? '', o.progress ?? '', o.manager_rating ?? '', o.notes ?? '',
    ]
  })
  const ws = XLSX.utils.aoa_to_sheet([groupRow, headers, ...body])
  // 按内容自动设列宽（中文按 2 字宽），让导出和页面一样完整显示
  const cw = (v: any) => {
    let w = 0
    for (const ch of String(v ?? '')) w += /[⺀-￿]/.test(ch) ? 2 : 1
    return w
  }
  ws['!cols'] = headers.map((h, c) => {
    let max = cw(h)
    for (const row of body) max = Math.max(max, cw(row[c]))
    return { wch: Math.min(Math.max(max + 2, 6), 42) }
  })
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 0, c: 12 }, e: { r: 0, c: 14 } },
    { s: { r: 0, c: 15 }, e: { r: 0, c: 19 } },
    { s: { r: 0, c: 20 }, e: { r: 0, c: 21 } },
    { s: { r: 0, c: 22 }, e: { r: 1, c: 22 } },
    { s: { r: 0, c: 23 }, e: { r: 1, c: 23 } },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '加工厂合作跟踪汇总表')
  XLSX.writeFile(wb, '加工厂合作跟踪汇总表.xlsx')
}
</script>
<template>
  <AppLayout>
    <div class="page wide">
      <div class="toolbar">
        <h2 style="margin:0">加工厂合作跟踪汇总表</h2>
        <span class="muted">共 {{ rows.length }} 条</span>
        <span class="spacer"></span>
        <button @click="exportExcel">导出 Excel</button>
      </div>
      <div class="scroll">
        <table class="summary">
          <thead>
            <tr class="grp">
              <th :colspan="12">工厂基础信息（外发组+PMC负责）</th>
              <th :colspan="3">交期准时性（PMC负责）</th>
              <th :colspan="5">品质管理（QC负责）</th>
              <th :colspan="2">生产进度（生产/PMC/外发负责）</th>
              <th>综合评价</th>
              <th rowspan="2">备注</th>
            </tr>
            <tr>
              <th>序号</th><th>厂名</th><th>联系人</th><th>联系电话</th><th>工厂地址</th>
              <th>设备台数/生产拉台</th><th>帮我们生产的机台/生产线</th><th>员工人数</th><th>产能/年生意额(万)</th>
              <th>加工类型</th><th>环评/消防/安监资质</th><th>工厂评级</th>
              <th>是否有延期</th><th>延期天数</th><th>主要延期原因</th>
              <th>来料抽检单数</th><th>不良单数</th><th>合格率</th><th>是否已解决</th><th>外发/品质巡查问题点</th>
              <th>当前在生产产品</th><th>生产完成进度(%)</th>
              <th>经理评分(1-10)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="r.o.id">
              <td>{{ i + 1 }}</td>
              <td>{{ r.f?.name ?? r.o.expand?.factory?.name ?? '-' }}</td>
              <td>{{ r.f?.contact_person || '-' }}</td>
              <td>{{ r.f?.contact_phone || '-' }}</td>
              <td>{{ r.f?.address || '-' }}</td>
              <td>{{ equipSummary(r.f) || '-' }}</td>
              <td>{{ r.f?.production_lines || '-' }}</td>
              <td>{{ r.f?.staff_count ?? '-' }}</td>
              <td>{{ r.f?.annual_revenue ?? '-' }}</td>
              <td>{{ r.f?.processable_types || '-' }}</td>
              <td>{{ r.f?.has_certs ? '是' : '否' }}</td>
              <td><span v-if="r.grade" class="badge" :class="'badge-' + r.grade">{{ r.grade }}</span><span v-else>-</span></td>
              <td>{{ r.o.is_delayed ? '是' : '否' }}</td>
              <td>{{ r.o.delay_days ?? '-' }}</td>
              <td>{{ r.o.delay_reason || '-' }}</td>
              <td>{{ r.o.inspect_count ?? '-' }}</td>
              <td>{{ r.o.defect_count ?? '-' }}</td>
              <td>{{ passRate(r.o) || '-' }}</td>
              <td>{{ r.o.is_resolved ? '是' : '否' }}</td>
              <td>{{ r.o.quality_issues || '-' }}</td>
              <td>{{ r.o.current_product || '-' }}</td>
              <td>{{ r.o.progress != null ? r.o.progress + '%' : '-' }}</td>
              <td><input class="rate" :value="r.o.manager_rating ?? ''" type="number" min="1" max="10" placeholder="-" @change="rate(r.o, $event)" /></td>
              <td>{{ r.o.notes || '-' }}</td>
            </tr>
            <tr v-if="!rows.length"><td colspan="24" class="hint" style="text-align:center">暂无数据</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>
<style scoped>
.wide { max-width: none; }
.scroll { overflow-x: auto; }
.summary { min-width: 2200px; }
.summary th, .summary td { white-space: nowrap; }
.grp th { background: #f0f2f8; text-align: center; border-left: 1px solid var(--border); }
.rate { width: 60px; padding: .3rem .4rem; font-size: .85rem; }
</style>
