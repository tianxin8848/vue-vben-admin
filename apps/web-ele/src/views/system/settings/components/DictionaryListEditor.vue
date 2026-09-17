<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { computed, onMounted, ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton, ElDialog, ElForm, ElFormItem, ElInput } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { toastWarning } from '#/utils/message';
import { confirmDelete } from '#/utils/modal';

const props = defineProps<{ kind: keyof typeof KIND_CONFIG }>();

const emit = defineEmits<{ save: [] }>();

/**
 * 部门 / 岗位 / 地区三组字典列表。
 *
 * 三者在结构上完全一致——都是一个只有「名称」一列的表格，配一个新增/编辑
 * 输入框和删除确认，差异只在文案与 grid id。所以这里用一张 kind 配置表把
 * 差异集中掉，模板只保留一份。
 *
 * 双向绑定的值是「换行分隔的字符串」而不是数组，因为父级要把它直接拼进
 * PUT /api/v1/system-settings 的 departments / positions / regions 字段。
 * 字符串与列表项的互转在组件内部完成。
 */
const KIND_CONFIG = {
  dept: {
    add: 'addDept',
    addTitle: 'deptTitle',
    editTitle: 'deptEditTitle',
    gridId: 'settings-dept-list',
    list: 'deptList',
    name: 'deptName',
    placeholder: 'deptPlaceholder',
    required: 'deptNameRequired',
  },
  pos: {
    add: 'addPos',
    addTitle: 'posTitle',
    editTitle: 'posEditTitle',
    gridId: 'settings-pos-list',
    list: 'posList',
    name: 'posName',
    placeholder: 'posPlaceholder',
    required: 'posNameRequired',
  },
  region: {
    add: 'addRegion',
    addTitle: 'regionTitle',
    editTitle: 'regionEditTitle',
    gridId: 'settings-region-list',
    list: 'regionList',
    name: 'regionName',
    placeholder: 'regionPlaceholder',
    required: 'regionNameRequired',
  },
} as const;

const I18N_PREFIX = 'page.system.settingsDetail.form';

interface ListItem {
  id: string;
  name: string;
}

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

/** 值 = 父级维护的换行分隔字符串 */
const value = defineModel<string>({ required: true });

const { t } = useI18n();

const config = computed(() => KIND_CONFIG[props.kind]);

/** 所有文案集中在这里解析一次，模板只引用字段名 */
const texts = computed(() => {
  const c = config.value;
  return {
    actionTitle: t(`${I18N_PREFIX}.column.action`),
    addText: t(`${I18N_PREFIX}.${c.add}`),
    cancelText: t(`${I18N_PREFIX}.dialog.cancel`),
    confirmText: t(`${I18N_PREFIX}.dialog.confirm`),
    deleteText: t(`${I18N_PREFIX}.delete`),
    editText: t(`${I18N_PREFIX}.edit`),
    listTitle: t(`${I18N_PREFIX}.${c.list}`),
    nameLabel: t(`${I18N_PREFIX}.column.${c.name}`),
    placeholder: t(`${I18N_PREFIX}.dialog.${c.placeholder}`),
    seqTitle: t(`${I18N_PREFIX}.column.seq`),
  };
});

const items = ref<ListItem[]>(strToList(value.value));

const gridOptions = computed<VxeGridProps<ListItem>>(() => ({
  id: config.value.gridId,
  columns: [
    { type: 'seq', width: 70, title: texts.value.seqTitle },
    {
      field: 'name',
      title: texts.value.nameLabel,
      minWidth: 150,
    },
    {
      title: texts.value.actionTitle,
      width: 140,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  customConfig: { storage: false },
  proxyConfig: { enabled: false },
  rowConfig: { keyField: 'id' },
  toolbarConfig: { zoom: true, custom: false },
}));

const [ListTable, listTableApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
});

// 父级重新拉取设置时会改动字符串，此时重建列表；
// 自身提交时的写入不会走到这里——那时 value 恰好等于 listToStr(items)
watch(value, (newVal) => {
  if (newVal !== listToStr(items.value)) {
    items.value = strToList(newVal);
    listTableApi.setGridOptions({ data: items.value });
  }
});

watch(gridOptions, () => {
  listTableApi.setGridOptions(gridOptions.value);
});

onMounted(() => {
  listTableApi.setGridOptions({ data: items.value });
});

const mode = ref<'add' | 'edit'>('add');
const editingId = ref('');
const inputValue = ref('');
const dialogVisible = ref(false);

/** 对话框标题按新增/编辑切换 */
const dialogTitle = computed(() => {
  const key =
    mode.value === 'edit' ? config.value.editTitle : config.value.addTitle;
  return t(`${I18N_PREFIX}.dialog.${key}`);
});

function openAdd() {
  mode.value = 'add';
  editingId.value = '';
  inputValue.value = '';
  dialogVisible.value = true;
}

function openEdit(row: ListItem) {
  mode.value = 'edit';
  editingId.value = row.id;
  inputValue.value = row.name;
  dialogVisible.value = true;
}

/**
 * 提交单个条目。
 *
 * 后端 PUT /api/v1/system-settings 是全量替换，无法只改单条，所以每次
 * 单条变更都把整串写回 value，再由父级 emit('save') 触发全量 PUT。
 */
function commit() {
  const name = inputValue.value.trim();
  if (!name) {
    toastWarning(t(`${I18N_PREFIX}.validation.${config.value.required}`));
    return;
  }

  if (mode.value === 'add') {
    items.value.push({ id: String(Date.now()), name });
  } else {
    const target = items.value.find((i) => i.id === editingId.value);
    if (target) {
      target.name = name;
    }
  }

  value.value = listToStr(items.value);
  listTableApi.setGridOptions({ data: items.value });
  inputValue.value = '';
  editingId.value = '';
  dialogVisible.value = false;
  emit('save');
}

async function remove(row: ListItem) {
  const confirmed = await confirmDelete({
    message: t(`${I18N_PREFIX}.dialog.deleteConfirm`, { name: row.name }),
    title: t(`${I18N_PREFIX}.dialog.deleteConfirmTitle`),
  });
  if (!confirmed) return;

  items.value = items.value.filter((i) => i.id !== row.id);
  value.value = listToStr(items.value);
  listTableApi.setGridOptions({ data: items.value });
  emit('save');
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <span class="text-base font-semibold">{{ texts.listTitle }}</span>
      <ElButton size="small" type="primary" @click="openAdd">
        {{ texts.addText }}
      </ElButton>
    </div>
    <ListTable>
      <template #action="{ row }">
        <ElButton
          size="small"
          link
          type="primary"
          @click="openEdit(row as ListItem)"
        >
          {{ texts.editText }}
        </ElButton>
        <ElButton
          size="small"
          link
          type="danger"
          @click="remove(row as ListItem)"
        >
          {{ texts.deleteText }}
        </ElButton>
      </template>
    </ListTable>
  </div>

  <ElDialog v-model="dialogVisible" :title="dialogTitle" width="400px">
    <ElForm :model="{ name: inputValue }" label-width="80px">
      <ElFormItem :label="texts.nameLabel">
        <ElInput v-model="inputValue" :placeholder="texts.placeholder" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">{{ texts.cancelText }}</ElButton>
      <ElButton type="primary" @click="commit">
        {{ texts.confirmText }}
      </ElButton>
    </template>
  </ElDialog>
</template>
