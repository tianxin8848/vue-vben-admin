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

import { deleteRegionalHolidayApi, updateRegionalHolidaysApi } from '#/api';

const holidays = ref<SystemSettingsApi.RegionalHoliday[]>([]);

const showCreateModal = ref(false);
const holidayForm = reactive<SystemSettingsApi.CreateHolidayParams>({
  name: '',
  date: '',
  type: 'fixed',
  region: '',
});

const typeOptions = [
  { label: '固定日期', value: 'fixed' },
  { label: '可变日期', value: 'variable' },
];

const regionOptions = [
  { label: '全国', value: '全国' },
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
];

function formatType(type: string) {
  return typeOptions.find((o) => o.value === type)?.label || type;
}

async function handleCreate() {
  if (!holidayForm.name || !holidayForm.date) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  try {
    await updateRegionalHolidaysApi(holidayForm);
    ElMessage.success('创建成功');
    showCreateModal.value = false;
    holidayForm.name = '';
    holidayForm.date = '';
    holidayForm.type = 'fixed';
    holidayForm.region = '';
    fetchHolidays();
  } catch {
    ElMessage.error('创建失败');
  }
}

async function handleDelete(id: string) {
  try {
    await deleteRegionalHolidayApi(id);
    ElMessage.success('删除成功');
    fetchHolidays();
  } catch {
    ElMessage.error('删除失败');
  }
}

async function fetchHolidays() {
  holidays.value = [];
}

fetchHolidays();
</script>

<template>
  <div class="holidays-page">
    <h2>区域节日管理</h2>
    <div style="margin-bottom: 20px">
      <ElButton type="primary" @click="showCreateModal = true">
        新增节日
      </ElButton>
    </div>

    <ElTable :data="holidays" border stripe>
      <ElTableColumn prop="name" label="节日名称" />
      <ElTableColumn prop="date" label="日期" />
      <ElTableColumn prop="type" label="类型">
        <template #default="{ row }">{{ formatType(row.type) }}</template>
      </ElTableColumn>
      <ElTableColumn prop="region" label="适用区域" />
      <ElTableColumn prop="createdAt" label="创建时间" />
      <ElTableColumn label="操作" width="150">
        <template #default="{ row }">
          <ElButton size="small" type="danger" @click="handleDelete(row.id)">
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="showCreateModal" title="新增区域节日" width="500px">
      <ElForm :model="holidayForm" label-width="100px">
        <ElFormItem label="节日名称">
          <ElInput v-model="holidayForm.name" />
        </ElFormItem>
        <ElFormItem label="日期">
          <ElDatePicker v-model="holidayForm.date" type="date" />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="holidayForm.type">
            <ElOption
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
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

<style scoped>
.holidays-page {
  padding: 20px;
}
</style>
