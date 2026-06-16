<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as XLSX from 'xlsx'
import AppLayout from '../components/AppLayout.vue'
import { useFactoriesStore, filterByCraft } from '../stores/factories'
import { useAuthStore } from '../stores/auth'
import { visibleCraft } from '../utils/permissions'
import { CRAFT_LABELS, type Craft } from '../constants/roles'
import type { Factory } from '../types/factory'

const store = useFactoriesStore()
const auth = useAuthStore()
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => store.fetchAll())

// 部门名 → craft（同时接受「注塑部」「注塑」两种写法）
const DEPT_TO_CRAFT: Record<string, Craft> = {}
for (const [craft, label] of Object.entries(CRAFT_LABELS)) {
  DEPT_TO_CRAFT[label] = craft as Craft
  DEPT_TO_CRAFT[label.replace('部', '')] = craft as Craft
}

function exportExcel() {
  const data = visible.value.map((f) => ({
    名称: f.name,
    部门: CRAFT_LABELS[f.craft],
    联系人: f.contact_person ?? '',
    电话: f.contact_phone ?? '',
    地址: f.address ?? '',
    '厂房面积(㎡)': f.workshop_area ?? '',
    人员: f.staff_count ?? '',
    '设备(类型×数量)': (f.equipment_list ?? []).map((e) => (e.qty ? `${e.type}×${e.qty}` : e.type)).join('，'),
    可加工类型: f.processable_types ?? '',
    年生意额: f.annual_revenue ?? '',
    '环评/消防/安监资质': f.has_certs ? '是' : '否',
    '厂房图片/证书': (f.workshop_photos ?? []).join('，'),
  }))
  const empty = { 名称: '', 部门: '', 联系人: '', 电话: '', 地址: '', '厂房面积(㎡)': '', 人员: '', '设备(类型×数量)': '', 可加工类型: '', 年生意额: '', '环评/消防/安监资质': '', '厂房图片/证书': '' }
  const ws = XLSX.utils.json_to_sheet(data.length ? data : [empty])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '工厂信息')
  XLSX.writeFile(wb, '工厂信息.xlsx')
}

async function importExcel(ev: Event) {
  const file = (ev.target as HTMLInputElement).files?.[0]
  if (!file) return
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { cellDates: true })
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]])
  let ok = 0, fail = 0
  for (const r of rows) {
    const name = String(r['名称'] ?? r['工厂名称'] ?? r['name'] ?? '').trim()
    const deptRaw = String(r['部门'] ?? r['工艺'] ?? '').trim()
    const craft = DEPT_TO_CRAFT[deptRaw]
    if (!name || !craft) { fail++; continue }
    const fd = new FormData()
    fd.append('name', name)
    fd.append('craft', craft)
    fd.append('contact_person', String(r['联系人'] ?? ''))
    fd.append('contact_phone', String(r['电话'] ?? r['联系电话'] ?? ''))
    fd.append('address', String(r['地址'] ?? ''))
    fd.append('processable_types', String(r['可加工类型'] ?? ''))
    const area = r['厂房面积(㎡)'] ?? r['厂房面积']
    if (area != null && area !== '') fd.append('workshop_area', String(area))
    for (const [col, key] of [['人员', 'staff_count'], ['年生意额', 'annual_revenue']] as const) {
      const v = r[col]
      if (v != null && v !== '') fd.append(key, String(v))
    }
    // 设备(类型×数量)：解析 "注塑机×3，喷涂线×2"
    const equipRaw = String(r['设备(类型×数量)'] ?? r['设备类型'] ?? '').trim()
    if (equipRaw) {
      const list = equipRaw.split(/[，,]/).map((s) => s.trim()).filter(Boolean).map((seg) => {
        const m = seg.split(/[×x*]/)
        return { type: m[0].trim(), qty: m[1] ? Number(m[1]) : null }
      })
      fd.append('equipment_list', JSON.stringify(list))
      fd.append('equipment_type', list.map((e) => e.type).join(','))
    }
    const certs = String(r['环评/消防/安监资质'] ?? '').trim()
    if (certs) fd.append('has_certs', /^(是|有|y|yes|true|1)$/i.test(certs) ? 'true' : 'false')
    fd.append('status', 'active')
    if (auth.userId) fd.append('created_by', auth.userId)
    // 注：厂房图片/证书为文件，无法从 Excel 单元格导入，请在工厂详情页单独上传
    try { await store.create(fd); ok++ } catch { fail++ }
  }
  await store.fetchAll()
  if (fileInput.value) fileInput.value.value = ''
  alert(`导入完成：成功 ${ok} 家` + (fail ? `，失败 ${fail} 家（缺名称或部门无法识别）` : '') + '\n（厂房图片/证书为文件，需在工厂详情页单独上传）')
}

const visible = computed(() =>
  filterByCraft(store.items, auth.role ? visibleCraft(auth.role) : null),
)
// 部门定义（底层值仍是 craft）
const DEPTS: { craft: Craft; name: string; icon: string }[] = [
  { craft: 'injection', name: '注塑部', icon: '🧩' },
  { craft: 'painting', name: '喷油部', icon: '🎨' },
  { craft: 'assembly', name: '装配部', icon: '🔧' },
  { craft: 'sewing', name: '车缝部', icon: '🧵' },
]
const cards = computed(() =>
  DEPTS.map((d) => {
    const list = visible.value.filter((f: Factory) => f.craft === d.craft)
    return {
      ...d,
      count: list.length,
      warn: list.filter((f) => f.status === 'limited' || f.status === 'suspended' || f.status === 'eliminated').length,
    }
  }).filter((c) => c.count > 0),
)
</script>
<template>
  <AppLayout>
    <div class="page">
      <div class="toolbar">
        <h2 style="margin:0">工厂信息管理</h2>
        <span class="muted">共 {{ visible.length }} 家 · {{ cards.length }} 个部门</span>
        <span class="spacer"></span>
        <button class="ghost" @click="exportExcel">导出 Excel</button>
        <button class="ghost" @click="fileInput?.click()">导入 Excel</button>
        <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display:none" @change="importExcel" />
        <RouterLink to="/factories/new"><button>+ 新增工厂</button></RouterLink>
      </div>

      <div class="dept-grid">
        <RouterLink v-for="c in cards" :key="c.craft" class="dept-card" :to="`/factories/dept/${c.craft}`">
          <span class="ico">{{ c.icon }}</span>
          <div class="info">
            <span class="name">{{ c.name }}</span>
            <span class="sub">{{ c.count }} 家工厂<span v-if="c.warn" class="warn"> · {{ c.warn }} 家预警</span></span>
          </div>
          <span class="arrow">→</span>
        </RouterLink>
      </div>

      <p v-if="!cards.length" class="hint">暂无工厂数据</p>
    </div>
  </AppLayout>
</template>
<style scoped>
.dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.dept-card {
  display: flex; align-items: center; gap: 1rem; text-decoration: none; color: var(--text);
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 1.25rem 1.4rem; box-shadow: var(--shadow); transition: all .15s ease;
}
.dept-card:hover {
  border-color: var(--primary-border); transform: translateY(-2px);
  box-shadow: 0 10px 24px -12px rgba(79,70,229,.45); text-decoration: none;
}
.ico { width: 52px; height: 52px; display: grid; place-items: center; font-size: 1.6rem; background: var(--primary-soft); border-radius: 14px; }
.info { display: flex; flex-direction: column; flex: 1; }
.name { font-size: 1.1rem; font-weight: 600; }
.sub { font-size: .85rem; color: var(--text-soft); }
.warn { color: var(--grade-c); font-weight: 600; }
.arrow { color: var(--text-faint); font-size: 1.2rem; }
</style>
