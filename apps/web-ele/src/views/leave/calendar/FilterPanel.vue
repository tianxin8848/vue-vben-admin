<script lang="ts" setup>
import { ElButton, ElCard, ElForm, ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

interface SearchForm {
  team: string;
  region: string;
  employee_keyword: string;
  risk_threshold: number;
  view_mode: 'standard' | 'detail';
  approval_status: string;
}

interface Props {
  searchForm: SearchForm;
  teams: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:searchForm', value: SearchForm): void;
  (e: 'resetFilters'): void;
}>();

const leaveTypeConfig: Record<string, { color: string; label: string; }> = {
  annual: { label: '年假', color: '#60a5fa' },
  personal: { label: '事假', color: '#fb923c' },
  sick: { label: '病假', color: '#f87171' },
  lieu: { label: '调休', color: '#4ade80' },
  long: { label: '长假', color: '#a78bfa' },
};

function updateField<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
  emit('update:searchForm', { ...props.searchForm, [key]: value });
}
</script>

<template>
  <ElCard>
    <template #header>
      <h3 style="margin: 0;">筛选控制</h3>
    </template>

    <ElForm :model="props.searchForm" label-width="100px" inline>
      <ElFormItem label="团队筛选">
        <ElSelect :model-value="props.searchForm.team" placeholder="全部成员" clearable @change="updateField('team', $event)" style="width: 160px">
          <ElOption label="全部成员" value="" />
          <ElOption v-for="t in teams" :key="t" :label="t" :value="t" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="员工搜索">
        <ElInput :model-value="props.searchForm.employee_keyword" placeholder="输入姓名高亮全年请假" @input="updateField('employee_keyword', $event)" style="width: 160px" />
      </ElFormItem>

      <ElFormItem label="人力预警阈值">
        <ElInput :model-value="props.searchForm.risk_threshold" type="number" :min="1" :max="20" @input="updateField('risk_threshold', Number($event))" style="width: 100px" />
      </ElFormItem>

      <ElFormItem label="视图模式">
        <ElSelect :model-value="props.searchForm.view_mode" @change="updateField('view_mode', $event)" style="width: 120px">
          <ElOption label="标准" value="standard" />
          <ElOption label="明细" value="detail" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="审批状态">
        <ElSelect :model-value="props.searchForm.approval_status" @change="updateField('approval_status', $event)" style="width: 120px">
          <ElOption label="全部状态" value="" />
          <ElOption label="仅已通过" value="approved" />
          <ElOption label="仅待审批" value="pending" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem>
        <ElButton @click="emit('resetFilters')">重置筛选</ElButton>
      </ElFormItem>
    </ElForm>

    <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;" v-for="(config, type) in leaveTypeConfig" :key="type">
        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%;" :style="{ background: config.color }"></span>
        {{ config.label }}
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
        <span style="display: inline-block; width: 16px; height: 12px; border-radius: 4px; background: #f1f5f9;"></span>
        周末/节假日底色
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
        <span style="display: inline-block; width: 16px; height: 12px; border-radius: 4px; background: rgba(96, 165, 250, 0.5);"></span>
        待审批为半透明
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
        <span style="display: inline-block; width: 16px; height: 12px; border-radius: 4px; background: #ede9fe;"></span>
        地区假期
      </div>
      <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b;">
        <span style="display: inline-block; width: 16px; height: 12px; border-radius: 4px; background: #ffffff; border: 2px solid #ef4444;"></span>
        达到预警阈值
      </div>
    </div>
  </ElCard>
</template>
