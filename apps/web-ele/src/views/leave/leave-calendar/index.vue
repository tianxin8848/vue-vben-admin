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
    <!-- 调休额度管理（管理员） -->
    <LieuAdminPanel class="mb-3" :employees="employeesDirectory" />

    <ElCard>
      <template #header>
        <CalendarToolbar
          v-model:active-tab="activeTab"
          v-model:region="searchForm.region"
          :current-time="currentTime"
          :regions="regions"
        />
      </template>

      <!-- 概览：统计卡片 + 筛选面板 -->
      <div v-show="activeTab === 'overview'">
        <StatsPanel :stats="stats" :annual-leave-summary="annualLeaveSummary" />

        <FilterPanel
          :search-form="searchForm"
          :teams="teams"
          @update:search-form="updateSearchForm"
          @reset-filters="resetFilters"
        />
      </div>

      <!-- 年历：月历格子 + 选中日详情 -->
      <div v-show="activeTab === 'calendar'">
        <CalendarPanel
          :day-map="dayMap"
          :selected-date-key="selectedDateKey"
          :current-year="currentYear"
          :search-form="searchForm"
          :regional-holidays="regionalHolidays"
          @select-date="onSelectDate"
          @panel-change="onPanelChange"
        />

        <DetailPanel
          :day-map="dayMap"
          :selected-date-key="selectedDateKey"
          :region="searchForm.region"
          :regional-holidays="regionalHolidays"
          @set-holiday="setHoliday"
          @remove-holiday="removeHoliday"
        />
      </div>
    </ElCard>
  </Page>
</template>
