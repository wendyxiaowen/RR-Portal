<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { Factory } from '../types/factory'
import { useAuthStore } from '../stores/auth'
import { CRAFT_LABELS } from '../constants/roles'

const props = defineProps<{ modelValue: Partial<Factory> }>()
const emit = defineEmits<{ (e: 'save', v: Partial<Factory>): void }>()
const auth = useAuthStore()

const form = reactive<Partial<Factory>>({ status: 'active', ...props.modelValue })
// 资质有效期/资质文件：仅 admin、供应链经理可改
const canEditQual = computed(() => auth.role === 'admin' || auth.role === 'sc_manager')
</script>
<template>
  <form class="factory-form" @submit.prevent="emit('save', { ...form })">
    <label>名称 <input v-model="form.name" required /></label>
    <label>工艺
      <select v-model="form.craft" required>
        <option v-for="(label, key) in CRAFT_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
    </label>
    <label>联系人 <input v-model="form.contact_person" /></label>
    <label>电话 <input v-model="form.contact_phone" /></label>
    <label>地址 <input v-model="form.address" /></label>
    <label>厂房面积(㎡) <input v-model.number="form.workshop_area" type="number" /></label>
    <label>资质有效期
      <input v-model="form.qualification_expiry" type="date" :disabled="!canEditQual" />
    </label>
    <p v-if="!canEditQual" class="hint">资质信息仅供应链经理/管理员可修改</p>
    <button type="submit">保存</button>
  </form>
</template>
<style scoped>
.factory-form { display: flex; flex-direction: column; gap: 0.6rem; max-width: 420px; }
.factory-form label { display: flex; flex-direction: column; gap: 0.2rem; }
.hint { color: #888; font-size: 0.85rem; }
</style>
