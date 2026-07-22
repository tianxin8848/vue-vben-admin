<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  deleteRegionalHolidayApi,
  getSystemSettingsApi,
  upsertRegionalHolidayApi,
} from '#/api';

const loading = ref(false);
const holidays = ref<SystemSettingsApi.RegionalHolidayItem[]>([]);

const showCreateModal = ref(false);
const holidayForm = reactive<SystemSettingsApi.RegionalHolidayUpsert>({
  date: '',
  holiday_name: '',
  region: '',
});

const regionOptions = [
  { label: '全国', value: '全国' },
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
  { label: '深圳', value: '深圳' },
];

async function fetchHolidays() {
  loading.value = true;
  try {
    const settings = await getSystemSettingsApi();
    holidays.value = settings.regional_holidays || [];
  } finally {
    loading.value = false;
  }
}

async function handleCreate() {
  if (!holidayForm.holiday_name || !holidayForm.date || !holidayForm.region) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    await upsertRegionalHolidayApi(holidayForm);
    ElMessage.success('创建成功');
    showCreateModal.value = false;
    holidayForm.holiday_name = '';
    holidayForm.date = '';
    holidayForm.region = '';
    fetchHolidays();
  } catch {
    ElMessage.error('创建失败');
  }
}

async function handleDelete(row: SystemSettingsApi.RegionalHolidayItem) {
  try {
    await deleteRegionalHolidayApi({ region: row.region, date: row.date });
    ElMessage.success('删除成功');
    fetchHolidays();
  } catch {
    ElMessage.error('删除失败');
  }
}

fetchHolidays();
</script>

<template>
  <div class="holidays-page" v-loading="loading">
    <h2>区域假日管理</h2>
    <div style="margin-bottom: 20px">
      <ElButton type="primary" @click="showCreateModal = true">
        新增假日
      </ElButton>
    </div>

    <ElTable :data="holidays" border stripe>
      <ElTableColumn prop="holiday_name" label="假日名称" />
      <ElTableColumn prop="date" label="日期" />
      <ElTableColumn prop="region" label="适用区域" />
      <ElTableColumn label="操作" width="120">
        <template #default="{ row }">
          <ElButton
            size="small"
            type="danger"
            @click="handleDelete(row)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="showCreateModal" title="新增区域假日" width="500px">
      <ElForm :model="holidayForm" label-width="100px">
        <ElFormItem label="假日名称">
          <ElInput v-model="holidayForm.holiday_name" />
        </ElFormItem>
        <ElFormItem label="日期">
          <ElDatePicker
            v-model="holidayForm.date"
            type="date"
            value-format="YYYY-MM-DD"
          />
        </ElFormItem>
        <ElFormItem label="适用区域">
          <ElSelect v-model="holidayForm.region">
            <ElOption
              v-for="opt in regionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>


