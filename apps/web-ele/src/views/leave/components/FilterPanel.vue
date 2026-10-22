<script lang="ts" setup>
import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
} from 'element-plus';

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
  (e: 'resetFilters'): void;
  (e: 'update:searchForm', value: SearchForm): void;
}>();

function updateField<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
  emit('update:searchForm', { ...props.searchForm, [key]: value });
}
</script>

<template>
  <!-- 筛选区：无独立卡片，用分隔线接在指标卡下方，避免卡片套卡片 -->
  <section class="mt-6 border-t border-border pt-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 class="text-base font-semibold">
        {{ $t('page.leave.calendarView.filter.title') }}
      </h3>
      <ElButton @click="emit('resetFilters')">
        {{ $t('page.leave.calendarView.filter.reset') }}
      </ElButton>
    </div>

    <div
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      <div>
        <div class="mb-1 text-sm text-muted-foreground">
          {{ $t('page.leave.calendarView.filter.team') }}
        </div>
        <ElSelect
          :model-value="props.searchForm.team"
          :placeholder="$t('page.leave.calendarView.filter.allMembers')"
          clearable
          style="width: 100%"
          @change="updateField('team', $event ?? '')"
        >
          <ElOption
            :label="$t('page.leave.calendarView.filter.allMembers')"
            value=""
          />
          <ElOption v-for="t in teams" :key="t" :label="t" :value="t" />
        </ElSelect>
      </div>

      <div>
        <div class="mb-1 text-sm text-muted-foreground">
          {{ $t('page.leave.calendarView.filter.employeeSearch') }}
        </div>
        <ElInput
          :model-value="props.searchForm.employee_keyword"
          :placeholder="$t('page.leave.calendarView.filter.searchPlaceholder')"
          clearable
          @input="updateField('employee_keyword', $event)"
        />
      </div>

      <div>
        <div class="mb-1 text-sm text-muted-foreground">
          {{ $t('page.leave.calendarView.filter.riskThreshold') }}
        </div>
        <ElInputNumber
          :model-value="props.searchForm.risk_threshold"
          :min="1"
          :max="20"
          controls-position="right"
          style="width: 100%"
          @change="updateField('risk_threshold', Number($event ?? 1))"
        />
      </div>

      <div>
        <div class="mb-1 text-sm text-muted-foreground">
          {{ $t('page.leave.calendarView.filter.viewMode') }}
        </div>
        <ElSelect
          :model-value="props.searchForm.view_mode"
          style="width: 100%"
          @change="updateField('view_mode', $event)"
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
      </div>

      <div>
        <div class="mb-1 text-sm text-muted-foreground">
          {{ $t('page.leave.calendarView.filter.approvalStatus') }}
        </div>
        <ElSelect
          :model-value="props.searchForm.approval_status"
          style="width: 100%"
          @change="updateField('approval_status', $event ?? '')"
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
      </div>
    </div>
  </section>
</template>
