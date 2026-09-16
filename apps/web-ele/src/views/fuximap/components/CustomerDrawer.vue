<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { CustomerApi } from '#/api';

import { computed, ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDrawer,
  ElInput,
  ElTable,
  ElTableColumn,
  ElTooltip,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createCustomerApi, updateCustomerApi } from '#/api';
import { toastSuccess } from '#/utils/message';

import { buildCustomerFormSchema } from '../data';

interface Props {
  visible: boolean;
  /** 编辑模式时传入，新建为 undefined */
  editing?: CustomerApi.CustomerResponse | null;
}

const props = withDefaults(defineProps<Props>(), {
  editing: null,
});

const emit = defineEmits<{
  success: [];
  'update:visible': [value: boolean];
}>();

const { t } = useI18n();

const loading = ref(false);

function closeDrawer() {
  emit('update:visible', false);
}

const isEdit = computed(() => !!props.editing);
const title = computed(() =>
  isEdit.value ? t('page.fuximap.editCustomer') : t('page.fuximap.addCustomer'),
);

// ─── 基础信息表单 ──────────────────────────────────────────────────────────
const baseFormOptions = computed<VbenFormProps>(() => ({
  schema: buildCustomerFormSchema(t),
  commonConfig: {
    labelWidth: 80,
    componentProps: { clearable: true },
  },
  wrapperClass: 'grid-cols-1',
}));

const [BaseForm, baseFormApi] = useVbenForm(baseFormOptions.value);

// 监听语言切换，更新表单 schema
watch(baseFormOptions, () => {
  baseFormApi.updateSchema(buildCustomerFormSchema(t) ?? []);
});

// ─── 联系人表格 ────────────────────────────────────────────────────────────
interface ContactRow {
  _id: number;
  role: string;
  name: string;
  phone: string;
  email: string;
}
const contactsRef = ref<ContactRow[]>([]);
let contactSeq = 0;

function addContact() {
  contactSeq += 1;
  contactsRef.value.push({
    _id: contactSeq,
    role: '',
    name: '',
    phone: '',
    email: '',
  });
}

function removeContact(row: ContactRow) {
  contactsRef.value = contactsRef.value.filter((c) => c._id !== row._id);
}

// ─── 同步编辑态数据 ────────────────────────────────────────────────────────
watch(
  () => props.visible,
  async (v) => {
    if (!v) return;
    loading.value = true;
    try {
      contactSeq = 0;
      if (isEdit.value && props.editing) {
        const e = props.editing;
        await baseFormApi.setValues({
          name: e.name ?? '',
          address: e.address ?? '',
          longitude: e.longitude ?? 0,
          latitude: e.latitude ?? 0,
          phone: e.phone ?? '',
          notes: e.notes ?? '',
        });
        contactsRef.value = (e.contacts ?? []).map((c) => ({
          _id: ++contactSeq,
          role: c.role ?? '',
          name: c.name ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
        }));
      } else {
        await baseFormApi.resetForm();
        await baseFormApi.setValues({
          longitude: 113.953_793,
          latitude: 22.543_099,
        });
        contactsRef.value = [];
        addContact();
      }
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

// ─── 提交 ──────────────────────────────────────────────────────────────────
async function handleSubmit() {
  loading.value = true;
  try {
    const baseValues = await baseFormApi.submitForm();
    const contacts: CustomerApi.CustomerContact[] = contactsRef.value
      .filter((c) => c.name || c.phone || c.email || c.role)
      .map(({ _id, ...rest }) => rest);

    const payload: CustomerApi.CustomerUpsert = {
      name: baseValues.name,
      address: baseValues.address,
      longitude: Number(baseValues.longitude),
      latitude: Number(baseValues.latitude),
      phone: baseValues.phone ?? '',
      notes: baseValues.notes ?? '',
      contacts,
    };

    if (isEdit.value && props.editing) {
      await updateCustomerApi(props.editing.id, payload);
      toastSuccess(t('page.fuximap.updateSuccess'));
    } else {
      await createCustomerApi(payload);
      toastSuccess(t('page.fuximap.createSuccess'));
    }
    emit('success');
    closeDrawer();
  } catch (error: any) {
    console.error(`[fuximap] ${t('page.fuximap.submitFailed')}`, error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <ElDrawer
    :model-value="props.visible"
    :loading="loading"
    :title="title"
    destroy-on-close
    direction="rtl"
    size="560px"
    @close="closeDrawer"
    @update:model-value="(v: boolean) => !v && closeDrawer()"
  >
    <div class="flex flex-col gap-5">
      <!-- 基础信息 -->
      <section>
        <h3 class="mb-3 text-sm font-semibold text-muted-foreground">
          {{ t('page.fuximap.basicInfo') }}
        </h3>
        <BaseForm />
      </section>

      <!-- 联系人 -->
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-muted-foreground">
            {{ t('page.fuximap.contacts') }}
          </h3>
          <ElButton size="small" type="primary" @click="addContact">
            {{ t('page.fuximap.addContact') }}
          </ElButton>
        </div>
        <ElTable :data="contactsRef" border size="small">
          <ElTableColumn :label="t('page.fuximap.role')" min-width="120">
            <template #default="{ row }">
              <ElInput
                v-model="row.role"
                :placeholder="t('page.fuximap.rolePlaceholder')"
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('page.fuximap.name')" min-width="120">
            <template #default="{ row }">
              <ElInput
                v-model="row.name"
                :placeholder="t('page.fuximap.namePlaceholder')"
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('page.fuximap.phone')" min-width="140">
            <template #default="{ row }">
              <ElInput
                v-model="row.phone"
                :placeholder="t('page.fuximap.phonePlaceholder')"
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn :label="t('page.fuximap.email')" min-width="180">
            <template #default="{ row }">
              <ElInput
                v-model="row.email"
                :placeholder="t('page.fuximap.emailPlaceholder')"
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('page.fuximap.actions')"
            width="70"
            align="center"
          >
            <template #default="{ row }">
              <ElTooltip :content="t('page.fuximap.delete')">
                <ElButton
                  link
                  type="danger"
                  @click="removeContact(row as ContactRow)"
                >
                  {{ t('page.fuximap.delete') }}
                </ElButton>
              </ElTooltip>
            </template>
          </ElTableColumn>
        </ElTable>
      </section>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton @click="closeDrawer">{{ t('page.fuximap.cancel') }}</ElButton>
        <ElButton :loading="loading" type="primary" @click="handleSubmit">
          {{ t('page.fuximap.save') }}
        </ElButton>
      </div>
    </template>
  </ElDrawer>
</template>
