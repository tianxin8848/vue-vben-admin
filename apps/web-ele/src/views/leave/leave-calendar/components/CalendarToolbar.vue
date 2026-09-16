<script lang="ts" setup>
import { computed } from 'vue';

import { ElOption, ElSegmented, ElSelect } from 'element-plus';

import { $t } from '#/locales';

import { leaveTypeLegendItems } from '../../shared/leave-types';

const props = defineProps<{
  /** 当前 UTC+8 时刻文本 */
  currentTime: string;
  /** 可选地区列表 */
  regions: string[];
}>();

/** 当前视图：概览与筛选 / 年历 */
const activeTab = defineModel<'calendar' | 'overview'>('activeTab', {
  required: true,
});
/** 已选地区；空串=全部，`__unset__`=未设置 */
const region = defineModel<string>('region', { required: true });

const segmentedOptions = computed(() => [
  { label: $t('page.leave.calendarView.overviewAndFilter'), value: 'overview' },
  { label: $t('page.leave.calendarView.yearCalendar'), value: 'calendar' },
]);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <span>{{ props.currentTime }}</span>

    <div class="flex flex-wrap items-center gap-3">
      <span
        v-for="cfg in leaveTypeLegendItems"
        :key="cfg.key"
        class="inline-flex items-center gap-1 text-xs text-muted-foreground"
      >
        <span
          :style="{ background: cfg.color }"
          class="inline-block size-2.5 rounded-full"
        ></span>
        {{ cfg.label }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ElSelect v-model="region">
        <ElOption :label="$t('page.leave.calendarView.allRegions')" value="" />
        <ElOption
          :label="$t('page.leave.calendarView.unsetRegion')"
          value="__unset__"
        />
        <ElOption v-for="r in props.regions" :key="r" :label="r" :value="r" />
      </ElSelect>
    </div>

    <ElSegmented
      v-model="activeTab"
      :options="segmentedOptions"
      style="margin-bottom: 12px"
    />
  </div>
</template>
