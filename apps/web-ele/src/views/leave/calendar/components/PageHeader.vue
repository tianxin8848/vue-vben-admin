<script lang="ts" setup>
import { ElButton, ElSelect, ElOption, ElTag } from 'element-plus';

interface Props {
  currentTime: string;
  currentYear: number;
  regions: string[];
  region: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'goBackHome'): void;
  (e: 'changeYear', delta: number): void;
  (e: 'goToCurrentYear'): void;
  (e: 'update:region', value: string): void;
}>();
</script>

<template>
  <ElCard :shadow="false" class="page-header-card">
    <div class="page-header">
      <div class="header-info">
        <h2>请假管理</h2>
        <p>请假管理包含"请假日历"和"流程维护"，当前为日历视图。</p>
        <ElTag type="info" size="small">{{ currentTime }}</ElTag>
      </div>
      <div class="header-actions">
        <ElButton @click="emit('goBackHome')">返回工作台</ElButton>
        <ElSelect v-model="props.region" @change="emit('update:region', $event)" style="width: 180px">
          <ElOption label="总览（全部地区）" value="" />
          <ElOption label="未设置地区" value="__unset__" />
          <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
        </ElSelect>
        <ElButton @click="emit('changeYear', -1)">上一年</ElButton>
        <ElTag size="large" type="primary" effect="dark">{{ currentYear }}</ElTag>
        <ElButton @click="emit('changeYear', 1)">下一年</ElButton>
        <ElButton type="primary" @click="emit('goToCurrentYear')">回到今年</ElButton>
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.header-info p {
  margin: 8px 0 12px;
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
