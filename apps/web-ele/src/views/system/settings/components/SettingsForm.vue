<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemSettingsApi } from '#/api';

import { nextTick, onMounted, ref, watch } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';
import { VxeColumn, VxeTable, VxeToolbar } from 'vxe-table';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSystemSettingsApi } from '#/api';

import 'vxe-table/styles/cssvar.scss';
import 'vxe-pc-ui/styles/cssvar.scss';

interface ListItem {
  id: string;
  name: string;
}

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

const deptList = ref<ListItem[]>([]);
const posList = ref<ListItem[]>([]);
const regionList = ref<ListItem[]>([]);

const showDeptDialog = ref(false);
const showPosDialog = ref(false);
const showRegionDialog = ref(false);
const newDeptName = ref('');
const newPosName = ref('');
const newRegionName = ref('');

const deptToolbarButtons = ref([{ name: '新增', code: 'add' }]);

const posToolbarButtons = ref([{ name: '新增', code: 'add' }]);

const regionToolbarButtons = ref([{ name: '新增', code: 'add' }]);

function strToList(str: string): ListItem[] {
  return str
    .split('\n')
    .filter((s) => s.trim())
    .map((s, i) => ({
      id: String(i),
      name: s.trim(),
    }));
}

function listToStr(list: ListItem[]): string {
  return list.map((item) => item.name).join('\n');
}

function updateLists() {
  deptList.value = strToList(localDeptStr.value);
  posList.value = strToList(localPosStr.value);
  regionList.value = strToList(localRegionStr.value);
}

function handleDeptAdd() {
  if (!newDeptName.value.trim()) {
    ElMessage.warning('请输入部门名称');
    return;
  }
  deptList.value.push({
    id: String(Date.now()),
    name: newDeptName.value.trim(),
  });
  localDeptStr.value = listToStr(deptList.value);
  emit('update:deptStr', localDeptStr.value);
  newDeptName.value = '';
  showDeptDialog.value = false;
}

function handlePosAdd() {
  if (!newPosName.value.trim()) {
    ElMessage.warning('请输入岗位名称');
    return;
  }
  posList.value.push({
    id: String(Date.now()),
    name: newPosName.value.trim(),
  });
  localPosStr.value = listToStr(posList.value);
  emit('update:posStr', localPosStr.value);
  newPosName.value = '';
  showPosDialog.value = false;
}

function handleRegionAdd() {
  if (!newRegionName.value.trim()) {
    ElMessage.warning('请输入地区名称');
    return;
  }
  regionList.value.push({
    id: String(Date.now()),
    name: newRegionName.value.trim(),
  });
  localRegionStr.value = listToStr(regionList.value);
  emit('update:regionStr', localRegionStr.value);
  newRegionName.value = '';
  showRegionDialog.value = false;
}

function handleDeptToolbarClick({ code }: { code: string }) {
  if (code === 'add') showDeptDialog.value = true;
}

function handlePosToolbarClick({ code }: { code: string }) {
  if (code === 'add') showPosDialog.value = true;
}

function handleRegionToolbarClick({ code }: { code: string }) {
  if (code === 'add') showRegionDialog.value = true;
}

async function updateCheckboxState() {
  await nextTick();
  localModules.value.forEach((row) => {
    gridApi.grid.setCheckboxRow(
      row,
      localSelectedModules.value.includes(row.module_code),
    );
  });
}

function handleCheckboxChange() {
  const records = gridApi.grid.getCheckboxRecords();
  const newSelected = records.map((r) => r.module_code);
  localSelectedModules.value = newSelected;
  emit('update:selectedModules', [...newSelected]);
}

const gridOptions: VxeGridProps<SystemSettingsApi.SystemModuleItem> = {
  rowConfig: {
    keyField: 'module_code',
  },
  checkboxConfig: {
    highlight: true,
    checkRowKeys: [],
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

onMounted(async () => {
  updateLists();
  try {
    const settings = await getSystemSettingsApi();
    localModules.value = settings?.modules || [];
    gridApi.setGridOptions({
      data: localModules.value,
    });
    await updateCheckboxState();
  } catch {
    localModules.value = [];
  }
});

watch(
  () => props.deptStr,
  (newVal) => {
    if (newVal !== localDeptStr.value) {
      localDeptStr.value = newVal;
      updateLists();
    }
  },
);

watch(
  () => props.posStr,
  (newVal) => {
    if (newVal !== localPosStr.value) {
      localPosStr.value = newVal;
      updateLists();
    }
  },
);

watch(
  () => props.regionStr,
  (newVal) => {
    if (newVal !== localRegionStr.value) {
      localRegionStr.value = newVal;
      updateLists();
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
  async (newVal) => {
    localSelectedModules.value = [...newVal];
    await updateCheckboxState();
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
      <VxeToolbar
        :buttons="deptToolbarButtons"
        @button-click="handleDeptToolbarClick"
      />
      <VxeTable :data="deptList">
        <VxeColumn type="seq" width="70" />
        <VxeColumn field="name" title="部门名称" />
      </VxeTable>
    </ElFormItem>
    <ElFormItem label="岗位列表">
      <VxeToolbar
        :buttons="posToolbarButtons"
        @button-click="handlePosToolbarClick"
      />
      <VxeTable :data="posList">
        <VxeColumn type="seq" width="70" />
        <VxeColumn field="name" title="岗位名称" />
      </VxeTable>
    </ElFormItem>
    <ElFormItem label="地区列表">
      <VxeToolbar
        :buttons="regionToolbarButtons"
        @button-click="handleRegionToolbarClick"
      />
      <VxeTable :data="regionList">
        <VxeColumn type="seq" width="70" />
        <VxeColumn field="name" title="地区名称" />
      </VxeTable>
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

  <ElDialog v-model="showDeptDialog" title="新增部门" width="400px">
    <ElForm :model="{ name: newDeptName }" label-width="80px">
      <ElFormItem label="部门名称">
        <ElInput v-model="newDeptName" placeholder="请输入部门名称" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showDeptDialog = false">取消</ElButton>
      <ElButton type="primary" @click="handleDeptAdd">确认</ElButton>
    </template>
  </ElDialog>

  <ElDialog v-model="showPosDialog" title="新增岗位" width="400px">
    <ElForm :model="{ name: newPosName }" label-width="80px">
      <ElFormItem label="岗位名称">
        <ElInput v-model="newPosName" placeholder="请输入岗位名称" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showPosDialog = false">取消</ElButton>
      <ElButton type="primary" @click="handlePosAdd">确认</ElButton>
    </template>
  </ElDialog>

  <ElDialog v-model="showRegionDialog" title="新增地区" width="400px">
    <ElForm :model="{ name: newRegionName }" label-width="80px">
      <ElFormItem label="地区名称">
        <ElInput v-model="newRegionName" placeholder="请输入地区名称" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showRegionDialog = false">取消</ElButton>
      <ElButton type="primary" @click="handleRegionAdd">确认</ElButton>
    </template>
  </ElDialog>
</template>
