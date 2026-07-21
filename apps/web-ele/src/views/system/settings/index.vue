<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
} from 'element-plus';

import { getSystemSettingsApi, updateSystemSettingsApi } from '#/api';

const loading = ref(false);
const settings = ref<null | SystemSettingsApi.SystemSettings>(null);

const settingsForm = reactive<Partial<SystemSettingsApi.SystemSettings>>({
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  workingHoursStart: '',
  workingHoursEnd: '',
  maxAnnualLeaveDays: 15,
  maxSickLeaveDays: 30,
});

async function fetchSettings() {
  loading.value = true;
  try {
    settings.value = await getSystemSettingsApi();
    Object.assign(settingsForm, settings.value);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  try {
    await updateSystemSettingsApi(settingsForm);
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
    <ElCard>
      <ElForm :model="settingsForm" label-width="150px">
        <h4 style="margin-bottom: 20px">公司信息</h4>
        <ElFormItem label="公司名称">
          <ElInput v-model="settingsForm.companyName" />
        </ElFormItem>
        <ElFormItem label="公司地址">
          <ElInput v-model="settingsForm.companyAddress" />
        </ElFormItem>
        <ElFormItem label="联系电话">
          <ElInput v-model="settingsForm.companyPhone" />
        </ElFormItem>
        <ElFormItem label="公司邮箱">
          <ElInput v-model="settingsForm.companyEmail" />
        </ElFormItem>

        <h4 style="margin: 30px 0 20px">工作时间</h4>
        <ElFormItem label="上班时间">
          <ElInput v-model="settingsForm.workingHoursStart" type="time" />
        </ElFormItem>
        <ElFormItem label="下班时间">
          <ElInput v-model="settingsForm.workingHoursEnd" type="time" />
        </ElFormItem>

        <h4 style="margin: 30px 0 20px">请假设置</h4>
        <ElFormItem label="年休假最大天数">
          <ElInputNumber
            v-model="settingsForm.maxAnnualLeaveDays"
            :min="0"
            :max="60"
          />
        </ElFormItem>
        <ElFormItem label="病假最大天数">
          <ElInputNumber
            v-model="settingsForm.maxSickLeaveDays"
            :min="0"
            :max="180"
          />
        </ElFormItem>

        <ElFormItem>
          <ElButton type="primary" @click="handleSave">保存设置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<style scoped>
.system-settings-page {
  max-width: 800px;
  padding: 20px;
}
</style>
