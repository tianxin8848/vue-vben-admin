<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

import { getSystemSettingsApi, updateSystemSettingsApi } from '#/api';

const loading = ref(false);
const settings = ref<null | SystemSettingsApi.SystemSettingsResponse>(null);

const settingsForm = reactive<SystemSettingsApi.SystemSettingsUpdate>({
  departments: [],
  positions: [],
  regions: [],
});

// 用于编辑的字符串（逗号分隔）
const deptStr = ref('');
const posStr = ref('');
const regionStr = ref('');

async function fetchSettings() {
  loading.value = true;
  try {
    settings.value = await getSystemSettingsApi();
    if (settings.value) {
      settingsForm.departments = [...settings.value.departments];
      settingsForm.positions = [...settings.value.positions];
      settingsForm.regions = [...settings.value.regions];
      deptStr.value = settings.value.departments.join('、');
      posStr.value = settings.value.positions.join('、');
      regionStr.value = settings.value.regions.join('、');
    }
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  try {
    const data: SystemSettingsApi.SystemSettingsUpdate = {
      departments: deptStr.value.split(/[、,，\n]/).map((s) => s.trim()).filter(Boolean),
      positions: posStr.value.split(/[、,，\n]/).map((s) => s.trim()).filter(Boolean),
      regions: regionStr.value.split(/[、,，\n]/).map((s) => s.trim()).filter(Boolean),
    };
    await updateSystemSettingsApi(data);
    ElMessage.success('保存成功');
    fetchSettings();
  } catch {
    ElMessage.error('保存失败');
  }
}

onMounted(() => {
  fetchSettings();
});
</script>

<template>
  <div class="system-settings-page" v-loading="loading">
    <h2>系统参数设置</h2>

    <ElCard v-if="settings" header="基础配置">
      <ElForm label-width="120px">
        <ElFormItem label="设置 ID">
          <ElInput :model-value="settings.id" disabled />
        </ElFormItem>
        <ElFormItem label="创建时间">
          <ElInput :model-value="settings.created_at || '-'" disabled />
        </ElFormItem>
        <ElFormItem label="更新时间">
          <ElInput :model-value="settings.updated_at || '-'" disabled />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard header="部门 / 职位 / 区域" style="margin-top: 20px">
      <ElForm label-width="120px">
        <ElFormItem label="部门列表">
          <ElInput
            v-model="deptStr"
            type="textarea"
            :rows="3"
            placeholder="用逗号分隔，如：技术部、产品部、人事部"
          />
        </ElFormItem>
        <ElFormItem label="岗位列表">
          <ElInput
            v-model="posStr"
            type="textarea"
            :rows="3"
            placeholder="用逗号分隔，如：工程师、产品经理、设计师"
          />
        </ElFormItem>
        <ElFormItem label="区域列表">
          <ElInput
            v-model="regionStr"
            type="textarea"
            :rows="3"
            placeholder="用逗号分隔，如：北京、上海、深圳"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSave">保存配置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard
      v-if="settings && settings.modules.length > 0"
      header="系统模块"
      style="margin-top: 20px"
    >
      <div style="display: flex; flex-wrap: wrap; gap: 8px">
        <ElTag
          v-for="mod in settings.modules"
          :key="mod.module_code"
          type="primary"
        >
          {{ mod.module_name }}（{{ mod.module_code }}）
        </ElTag>
      </div>
    </ElCard>
  </div>
</template>


