<script lang="ts" setup>
import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { $t } from '#/locales';

interface SearchForm {
  team: string;
  region: string;
  employee_keyword: string;
  risk_threshold: number;
  view_mode: 'detail' | 'standard';
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

function updateField<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
  emit('update:searchForm', { ...props.searchForm, [key]: value });
}
</script>

<template>
  <ElCard>
    <template #header>
      <h3 style="margin: 0">
        {{ $t('page.leave.calendarView.filter.title') }}
      </h3>
    </template>

    <ElForm :model="props.searchForm" label-width="auto" inline>
      <ElFormItem :label="$t('page.leave.calendarView.filter.team')">
        <ElSelect
          :model-value="props.searchForm.team"
          :placeholder="$t('page.leave.calendarView.filter.allMembers')"
          clearable
          @change="updateField('team', $event)"
          style="width: 160px"
        >
          <ElOption
            :label="$t('page.leave.calendarView.filter.allMembers')"
            value=""
          />
          <ElOption v-for="t in teams" :key="t" :label="t" :value="t" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.calendarView.filter.employeeSearch')">
        <ElInput
          :model-value="props.searchForm.employee_keyword"
          :placeholder="$t('page.leave.calendarView.filter.searchPlaceholder')"
          @input="updateField('employee_keyword', $event)"
          style="width: 160px"
        />
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.calendarView.filter.riskThreshold')">
        <ElInput
          :model-value="props.searchForm.risk_threshold"
          type="number"
          :min="1"
          :max="20"
          @input="updateField('risk_threshold', Number($event))"
          style="width: 100px"
        />
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.calendarView.filter.viewMode')">
        <ElSelect
          :model-value="props.searchForm.view_mode"
          @change="updateField('view_mode', $event)"
          style="width: 120px"
        >
          <ElOption
            :label="$t('page.leave.calendarView.filter.standard')"
            value="standard"
          />
          <ElOption
            :label="$t('page.leave.calendarView.filter.detail')"
            value="detail"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.calendarView.filter.approvalStatus')">
        <ElSelect
          :model-value="props.searchForm.approval_status"
          @change="updateField('approval_status', $event)"
          style="width: 120px"
        >
          <ElOption
            :label="$t('page.leave.calendarView.filter.allStatus')"
            value=""
          />
          <ElOption
            :label="$t('page.leave.calendarView.filter.approvedOnly')"
            value="approved"
          />
          <ElOption
            :label="$t('page.leave.calendarView.filter.pendingOnly')"
            value="pending"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem>
        <ElButton @click="emit('resetFilters')">
          {{ $t('page.leave.calendarView.filter.reset') }}
        </ElButton>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>
