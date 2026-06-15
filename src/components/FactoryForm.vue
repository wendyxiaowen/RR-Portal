<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import type { Factory } from '../types/factory'
import { useAuthStore } from '../stores/auth'
import { pb } from '../pb'

const props = defineProps<{ modelValue: Partial<Factory> }>()
const emit = defineEmits<{ (e: 'save', v: FormData): void }>()
const auth = useAuthStore()

const form = reactive<Partial<Factory>>({ status: 'active', ...props.modelValue })
const photoInput = ref<HTMLInputElement | null>(null)
// 资质有效期/资质文件：仅 admin、供应链经理可改
const canEditQual = computed(() => auth.role === 'admin' || auth.role === 'sc_manager')

// 部门（底层值仍是 craft，保持权限/统计逻辑兼容）
const DEPTS = [
  { value: 'injection', label: '注塑部' },
  { value: 'painting', label: '喷油部' },
  { value: 'assembly', label: '装配部' },
  { value: 'sewing', label: '车缝部' },
]

// 已有厂房图片（编辑态展示）
const existingPhotos = computed(() => {
  const id = props.modelValue.id
  const photos = props.modelValue.workshop_photos
  if (!id || !photos?.length) return []
  return photos.map((p) => pb.files.getURL(props.modelValue as any, p, { thumb: '100x100' }))
})

function onSubmit() {
  const fd = new FormData()
  fd.append('name', form.name ?? '')
  fd.append('craft', form.craft ?? '')
  fd.append('contact_person', form.contact_person ?? '')
  fd.append('contact_phone', form.contact_phone ?? '')
  fd.append('address', form.address ?? '')
  fd.append('workshop_info', form.workshop_info ?? '')
  if (form.workshop_area != null && form.workshop_area !== ('' as any)) {
    fd.append('workshop_area', String(form.workshop_area))
  }
  if (canEditQual.value && form.qualification_expiry) {
    fd.append('qualification_expiry', form.qualification_expiry)
  }
  const files = photoInput.value?.files
  if (files) for (const f of Array.from(files)) fd.append('workshop_photos', f)
  emit('save', fd)
}
</script>
<template>
  <form class="factory-form" @submit.prevent="onSubmit">
    <label>名称 <input v-model="form.name" required /></label>
    <label>部门
      <select v-model="form.craft" required>
        <option v-for="d in DEPTS" :key="d.value" :value="d.value">{{ d.label }}</option>
      </select>
    </label>
    <label>联系人 <input v-model="form.contact_person" /></label>
    <label>电话 <input v-model="form.contact_phone" /></label>
    <label>地址 <input v-model="form.address" /></label>
    <label>厂房面积(㎡) <input v-model.number="form.workshop_area" type="number" /></label>
    <label>厂房基本信息
      <textarea v-model="form.workshop_info" rows="3" placeholder="厂房规模、产线数量、主要设备、人员配置等"></textarea>
    </label>
    <label>厂房图片
      <input ref="photoInput" type="file" multiple accept="image/*" />
      <span class="hint" v-if="modelValue.id">重新上传将替换原有图片</span>
    </label>
    <div v-if="existingPhotos.length" class="thumbs">
      <img v-for="(u, i) in existingPhotos" :key="i" :src="u" alt="厂房图片" />
    </div>
    <label>资质有效期
      <input v-model="form.qualification_expiry" type="date" :disabled="!canEditQual" />
    </label>
    <p v-if="!canEditQual" class="hint">资质信息仅供应链经理/管理员可修改</p>
    <button type="submit">保存</button>
  </form>
</template>
<style scoped>
.factory-form { display: flex; flex-direction: column; gap: 0.7rem; max-width: 460px; }
.factory-form label { display: flex; flex-direction: column; gap: 0.25rem; }
.factory-form textarea { width: 100%; }
.thumbs { display: flex; gap: .5rem; flex-wrap: wrap; }
.thumbs img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border); }
</style>
