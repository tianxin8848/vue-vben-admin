<script lang="ts" setup>
import { ElButton, ElOption, ElSelect, ElTag } from 'element-plus';

import { $t } from '#/locales';

interface Props {
  currentTime: string;
  currentYear: number;
  regions: string[];
  region: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'changeYear', delta: number): void;
  (e: 'goBackHome' | 'goToCurrentYear'): void;
  (e: 'update:region', value: string): void;
}>();
</script>

<template>
  <ElCard :shadow="false" class="page-header-card">
    <div class="page-header">
      <div class="header-info">
        <h2>{{ $t('page.leave.title') }}</h2>
        <p>{{ $t('page.leave.calendarView.description') }}</p>
        <ElTag type="info" size="small">{{ currentTime }}</ElTag>
      </div>
      <div class="header-actions">
        <ElButton @click="emit('goBackHome')">
          {{ $t('page.leave.calendarView.backToWorkspace') }}
        </ElButton>
        <ElSelect
          :model-value="region"
          style="width: 180px"
          @update:model-value="emit('update:region', $event)"
        >
          <ElOption
            :label="$t('page.leave.calendarView.allRegions')"
            value=""
          />
          <ElOption
            :label="$t('page.leave.calendarView.unsetRegion')"
            value="__unset__"
          />
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
        <ElButton @click="emit('changeYear', -1)">
          {{ $t('page.leave.calendarView.prevYear') }}
        </ElButton>
        <ElTag size="large" type="primary" effect="dark">
          {{ currentYear }}
        </ElTag>
        <ElButton @click="emit('changeYear', 1)">
          {{ $t('page.leave.calendarView.nextYear') }}
        </ElButton>
        <ElButton type="primary" @click="emit('goToCurrentYear')">
          {{ $t('page.leave.calendarView.backToCurrentYear') }}
        </ElButton>
      </div>
    </div>
  </ElCard>
</template>

<style scoped>
.page-header-card :deep(.el-card__body) {
  padding: 0;
}

.page-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.header-info p {
  margin: 8px 0 12px;
  font-size: 14px;
  color: #64748b;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
</style>
