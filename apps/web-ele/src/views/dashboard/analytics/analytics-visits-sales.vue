<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const props = defineProps<{
  data?: { name: string; value: number }[];
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const chartData = ref<{ name: string; value: number }[]>([]);

function renderChart() {
  if (chartData.value.length === 0) return;
  renderEcharts({
    series: [
      {
        animationDelay() {
          return Math.random() * 400;
        },
        animationEasing: 'exponentialInOut',
        animationType: 'scale',
        center: ['50%', '50%'],
        color: ['#5ab1ef', '#b6a2de', '#67e0e3', '#2ec7c9'],
        data: chartData.value.toSorted(
          (a: { value: number }, b: { value: number }) => {
            return a.value - b.value;
          },
        ),
        name: '部门统计',
        radius: '80%',
        roseType: 'radius',
        type: 'pie',
      },
    ],
    tooltip: {
      trigger: 'item',
    },
  });
}

onMounted(() => {
  if (props.data) {
    chartData.value = props.data;
    renderChart();
  }
});

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      chartData.value = newData;
      renderChart();
    }
  },
  { deep: true },
);
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
