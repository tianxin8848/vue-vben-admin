<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemSettingsApi } from '#/api';

import { nextTick, onMounted, ref, watch } from 'vue';

import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSystemSettingsApi } from '#/api';

const props = defineProps<{
  deptStr: string;
  posStr: string;
  regionStr: string;
  selectedModules: string[];
}>();

const emit = defineEmits<{
  (
    e: 'update:deptStr' | 'update:posStr' | 'update:regionStr',
    value: string,
  ): void;
  (e: 'update:selectedModules', value: string[]): void;
  (e: 'save'): void;
}>();

const localDeptStr = ref(props.deptStr);
const localPosStr = ref(props.posStr);
const localRegionStr = ref(props.regionStr);
const localSelectedModules = ref<string[]>([...props.selectedModules]);
const localModules = ref<SystemSettingsApi.SystemModuleItem[]>([]);

function handleCheckboxChange() {
  const records = gridApi.grid.getCheckboxRecords();
  localSelectedModules.value = records.map((r) => r.module_code);
  emit('update:selectedModules', [...localSelectedModules.value]);
}

const gridOptions: VxeGridProps<SystemSettingsApi.SystemModuleItem> = {
  checkboxConfig: {
    highlight: true,
  },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'module_name', title: '模块名称', minWidth: 150 },
    { field: 'module_code', title: '模块代码', minWidth: 150 },
  ],
  proxyConfig: {
    enabled: false,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
});

async function syncInitialSelection() {
  await nextTick();
  localModules.value.forEach((row) => {
    gridApi.grid.setCheckboxRow(
      row,
      localSelectedModules.value.includes(row.module_code),
    );
  });
}

onMounted(async () => {
  try {
    const settings = await getSystemSettingsApi();
    localModules.value = settings?.modules || [];
    gridApi.setGridOptions({ data: localModules.value });
    await syncInitialSelection();
  } catch {
    localModules.value = [];
  }
});

watch(
  () => props.deptStr,
  (newVal) => {
    if (newVal !== localDeptStr.value) {
      localDeptStr.value = newVal;
    }
  },
);

watch(
  () => props.posStr,
  (newVal) => {
    if (newVal !== localPosStr.value) {
      localPosStr.value = newVal;
    }
  },
);

watch(
  () => props.regionStr,
  (newVal) => {
    if (newVal !== localRegionStr.value) {
      localRegionStr.value = newVal;
    }
  },
);

watch(localDeptStr, (newVal) => {
  emit('update:deptStr', newVal);
});

watch(localPosStr, (newVal) => {
  emit('update:posStr', newVal);
});

watch(localRegionStr, (newVal) => {
  emit('update:regionStr', newVal);
});

watch(
  () => props.selectedModules,
  (newVal) => {
    localSelectedModules.value = [...newVal];
    syncInitialSelection();
  },
  { deep: true },
);

function selectAllModules() {
  gridApi.grid.setAllCheckboxRow(true);
  handleCheckboxChange();
}

function clearModules() {
  gridApi.grid.setAllCheckboxRow(false);
  handleCheckboxChange();
}

gridApi.setState({
  gridEvents: {
    checkboxChange: handleCheckboxChange,
    checkboxAll: handleCheckboxChange,
  },
});
</script>

<template>
  <ElForm label-width="120px">
    <ElFormItem label="部门列表">
      <ElInput
        v-model="localDeptStr"
        type="textarea"
        :rows="3"
        placeholder="例如：&#10;研发部&#10;运营部&#10;行政部"
      />
    </ElFormItem>
    <ElFormItem label="岗位列表">
      <ElInput
        v-model="localPosStr"
        type="textarea"
        :rows="3"
        placeholder="例如：&#10;前端开发&#10;后端开发&#10;人事专员"
      />
    </ElFormItem>
    <ElFormItem label="地区列表">
      <ElInput
        v-model="localRegionStr"
        type="textarea"
        :rows="3"
        placeholder="例如：&#10;深圳&#10;广州&#10;上海"
      />
    </ElFormItem>
    <ElFormItem label="模块列表">
      <div
        style="
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        "
      >
        <ElButton size="small" type="default" @click="selectAllModules">
          全选模块
        </ElButton>
        <ElButton size="small" type="default" @click="clearModules">
          清空选择
        </ElButton>
        <span style="font-weight: 700; color: #2563eb">已选择 {{ localSelectedModules.length }} 个模块</span>
      </div>
      <Grid />
      <p style="margin-top: 8px; font-size: 12px; color: #64748b">
        这里展示的是数据库中当前维护的系统模块，勾选后才会出现在用户权限分配中。
      </p>
    </ElFormItem>
    <ElFormItem>
      <ElButton type="primary" @click="$emit('save')">保存系统参数</ElButton>
    </ElFormItem>
  </ElForm>
</template>
