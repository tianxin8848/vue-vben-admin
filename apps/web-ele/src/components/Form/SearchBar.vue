<script lang="ts" setup>
import { reactive } from 'vue';

import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus';

interface Props {
  fields: any[];
  model: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits(['search', 'reset']);
const formData = reactive({ ...props.model });

function handleSearch() {
  emit('search', { ...formData });
}

function handleReset() {
  Object.keys(formData).forEach((key) => {
    formData[key] = '';
  });
  emit('reset');
}
</script>

<template>
  <div class="search-bar-wrapper">
    <ElForm :model="formData" inline>
      <ElFormItem
        v-for="field in fields"
        :key="field.prop"
        :label="field.label"
      >
        <ElInput
          v-model="formData[field.prop]"
          :placeholder="field.placeholder"
          clearable
        />
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
    </ElForm>
  </div>
</template>

<style scoped>
.search-bar-wrapper {
  padding: 16px;
  margin-bottom: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
</style>
