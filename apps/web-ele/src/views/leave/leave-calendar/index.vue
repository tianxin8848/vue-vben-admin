<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElCard } from 'element-plus';

import CalendarPanel from '../components/CalendarPanel.vue';
import DetailPanel from '../components/DetailPanel.vue';
import FilterPanel from '../components/FilterPanel.vue';
import StatsPanel from '../components/StatsPanel.vue';
import CalendarToolbar from './components/CalendarToolbar.vue';
import LieuAdminPanel from './components/LieuAdminPanel.vue';
import { useCalendarData } from './composables/useCalendarData';
import { useLiveClock } from './composables/useLiveClock';

// ─── 视图状态 ──────────────────────────────────────────────────────────────────
const activeTab = ref<'calendar' | 'overview'>('calendar');

// ─── 实时时钟（UTC+8，与日历取日基准一致） ──────────────────────────────────────
const { currentTime } = useLiveClock();

// ─── 数据层（日历记录 / 员工目录 / 区域假日 / 统计与筛选 / 假日增删） ────────────
const {
  annualLeaveSummary,
  currentYear,
  dayMap,
  employeesDirectory,
  onPanelChange,
  onSelectDate,
  regionalHolidays,
  regions,
  removeHoliday,
  resetFilters,
  searchForm,
  selectedDateKey,
  setHoliday,
  stats,
  teams,
  updateSearchForm,
} = useCalendarData();
</script>

<template>
  <Page>
    <div class="flex h-full flex-col gap-4">
      <!-- 调休额度管理（管理员） -->
      <LieuAdminPanel :employees="employeesDirectory" />

      <ElCard shadow="never">
        <!-- 工具栏放到卡片内容区顶部：横跨整宽，切换器与地区筛选不再被表头挤到卡片外 -->
        <div class="mb-4 border-b border-border pb-4">
          <CalendarToolbar
            v-model:active-tab="activeTab"
            v-model:region="searchForm.region"
            :current-time="currentTime"
            :regions="regions"
          />
        </div>

        <!-- 概览：统计卡片 + 筛选面板 -->
        <div v-show="activeTab === 'overview'">
          <StatsPanel
            :annual-leave-summary="annualLeaveSummary"
            :stats="stats"
          />

          <FilterPanel
            :search-form="searchForm"
            :teams="teams"
            @reset-filters="resetFilters"
            @update:search-form="updateSearchForm"
          />
        </div>

        <!-- 年历：月历格子 + 选中日详情 -->
        <div v-show="activeTab === 'calendar'">
          <CalendarPanel
            :current-year="currentYear"
            :day-map="dayMap"
            :regional-holidays="regionalHolidays"
            :search-form="searchForm"
            :selected-date-key="selectedDateKey"
            @panel-change="onPanelChange"
            @select-date="onSelectDate"
          />

          <DetailPanel
            :day-map="dayMap"
            :region="searchForm.region"
            :regional-holidays="regionalHolidays"
            :selected-date-key="selectedDateKey"
            @remove-holiday="removeHoliday"
            @set-holiday="setHoliday"
          />
        </div>
      </ElCard>
    </div>
  </Page>
</template>
