<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { createLeaveRequestApi, getMyLeaveHandoverOptionsApi } from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

import { leaveTypeLabelOverride } from '../../shared/leave-types';
import { createSessionOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

// 表单数据
const form = reactive<LeaveRequestApi.CreateLeaveRequestParams>({
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  session: 'full_day',
  handover_to: null,
  reason: null,
});

// 结束日期选择器：选了开始日期后，禁用开始日之前的所有日期（end ≥ start）
function disabledEndDate(time: Date) {
  if (!form.start_date) return false;
  const start = new Date(`${form.start_date}T00:00:00`);
  return time.getTime() < start.getTime();
}

// 半日假（morning/afternoon）必须单日：结束日自动等于开始日，并锁定结束选择器
const isHalfDay = computed(() => form.session !== 'full_day');

watch(
  () => [form.session, form.start_date],
  () => {
    if (form.session !== 'full_day') {
      form.end_date = form.start_date || '';
    }
  },
);

// 病假证明文件
const medicalCertificate = ref<File | null>(null);
const isSickLeave = computed(() => form.leave_type === 'sick');

// ─── 工作交接人 ──────────────────────────────────────────────────────────────
// 选项来自后端 /me/leave-requests/handover-options：**全部用户**（不限同部门），
// 且包含已停用员工与系统管理员，故停用者需标注。

const handoverOptions = ref<LeaveRequestApi.LeaveHandoverOption[]>([]);

/** 交接人下拉的值：后端 handover_to 是文本字段，取「姓名 || 账号」 */
function handoverOptionValue(item: LeaveRequestApi.LeaveHandoverOption) {
  return (item.full_name || item.username || '').trim();
}

/** 交接人下拉的文案：姓名（部门 · 账号 · 停用），账号与姓名相同时不重复展示 */
function handoverOptionLabel(item: LeaveRequestApi.LeaveHandoverOption) {
  const name = handoverOptionValue(item);
  const extras: string[] = [];
  if (item.department) {
    extras.push(item.department);
  }
  if (item.username && item.full_name && item.username !== item.full_name) {
    extras.push(item.username);
  }
  if (item.is_active === false) {
    extras.push($t('page.leave.employeeLeave.form.handoverInactive') as string);
  }
  return extras.length > 0 ? `${name}（${extras.join(' · ')}）` : name;
}

/** 空值统一收敛为 null，便于提交时交给后端判空 */
const handoverValue = computed({
  get: () => form.handover_to ?? '',
  set: (value: string) => {
    form.handover_to = value || null;
  },
});

async function loadHandoverOptions() {
  try {
    handoverOptions.value = await getMyLeaveHandoverOptionsApi();
  } catch {
    // 加载失败时保持为空，交接人按「选填」处理，不阻断请假提交
    handoverOptions.value = [];
  }
}

// 请假类型映射：直接用接口 system-settings.leave_types（code → 显示文本）
const leaveTypeOptions = leaveTypeLabelOverride;
const sessionOptions = computed(() => createSessionOptions($t));

const [Modal, modalApi] = useVbenModal({
  title: $t('page.leave.employeeLeave.modal.title'),
  onConfirm: handleSubmit,
  onCancel: () => {
    resetForm();
    modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      loadHandoverOptions();
    } else {
      resetForm();
    }
  },
});

// 病假证明文件选择 / 移除
function handleMedicalCertificateChange(file: { raw?: File }) {
  medicalCertificate.value = file.raw ?? null;
}

function handleMedicalCertificateRemove() {
  medicalCertificate.value = null;
}

// 提交请假申请
async function handleSubmit() {
  if (!form.start_date || !form.end_date) {
    toastWarning($t('page.leave.employeeLeave.validation.completeDates'));
    return;
  }

  if (form.start_date > form.end_date) {
    toastWarning($t('page.leave.employeeLeave.validation.startAfterEnd'));
    return;
  }

  if (form.session !== 'full_day' && form.start_date !== form.end_date) {
    toastWarning($t('page.leave.employeeLeave.validation.sessionSingleDay'));
    return;
  }

  if (isSickLeave.value && !medicalCertificate.value) {
    toastWarning(
      $t('page.leave.employeeLeave.validation.medicalCertificateRequired'),
    );
    return;
  }

  modalApi.setState({ confirmLoading: true });
  try {
    await createLeaveRequestApi(
      {
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        session: form.session,
        handover_to: form.handover_to || null,
        reason: form.reason || null,
      },
      medicalCertificate.value,
    );

    toastSuccess($t('page.leave.employeeLeave.message.submitSuccess'));
    resetForm();
    modalApi.close();
    emit('success');
  } catch (error) {
    handleActionError(
      'leave/employee-leave',
      error,
      $t('page.leave.employeeLeave.message.submitFailed'),
    );
  } finally {
    modalApi.setState({ confirmLoading: false });
  }
}

// 重置表单
function resetForm() {
  form.leave_type = 'annual';
  form.start_date = '';
  form.end_date = '';
  form.session = 'full_day';
  form.handover_to = null;
  form.reason = null;
  medicalCertificate.value = null;
}

function open() {
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-150" :title="$t('page.leave.employeeLeave.modal.title')">
    <ElForm :model="form" label-width="100px">
      <ElFormItem
        :label="$t('page.leave.employeeLeave.form.leaveType')"
        required
      >
        <ElSelect v-model="form.leave_type" style="width: 100%">
          <ElOption
            v-for="(label, value) in leaveTypeOptions"
            :key="value"
            :label="label"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.employeeLeave.form.session')" required>
        <ElSelect v-model="form.session" style="width: 100%">
          <ElOption
            v-for="(label, value) in sessionOptions"
            :key="value"
            :label="label"
            :value="value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem
        :label="$t('page.leave.employeeLeave.form.startDate')"
        required
      >
        <ElDatePicker
          v-model="form.start_date"
          type="date"
          value-format="YYYY-MM-DD"
          :placeholder="
            $t('page.leave.employeeLeave.form.startDatePlaceholder')
          "
          style="width: 100%"
        />
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.employeeLeave.form.endDate')" required>
        <ElDatePicker
          v-model="form.end_date"
          type="date"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledEndDate"
          :disabled="isHalfDay"
          :placeholder="$t('page.leave.employeeLeave.form.endDatePlaceholder')"
          style="width: 100%"
        />
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.employeeLeave.form.handoverTo')">
        <ElSelect
          v-model="handoverValue"
          :placeholder="
            $t('page.leave.employeeLeave.form.handoverToPlaceholder')
          "
          class="w-full"
          clearable
          filterable
        >
          <ElOption
            v-for="item in handoverOptions"
            :key="item.id"
            :label="handoverOptionLabel(item)"
            :value="handoverOptionValue(item)"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="$t('page.leave.employeeLeave.form.reason')">
        <ElInput
          v-model="form.reason"
          type="textarea"
          :rows="3"
          :placeholder="$t('page.leave.employeeLeave.form.reasonPlaceholder')"
        />
      </ElFormItem>

      <ElFormItem
        v-if="isSickLeave"
        :label="$t('page.leave.employeeLeave.form.medicalCertificate')"
        required
      >
        <ElUpload
          :auto-upload="false"
          :limit="1"
          :on-change="handleMedicalCertificateChange"
          :on-remove="handleMedicalCertificateRemove"
          :on-exceed="
            () =>
              medicalCertificate &&
              toastWarning(
                $t(
                  'page.leave.employeeLeave.validation.medicalCertificateSingle',
                ),
              )
          "
        >
          <ElButton type="primary" plain>
            {{ $t('page.leave.employeeLeave.form.medicalCertificateButton') }}
          </ElButton>
          <template #tip>
            <div style="font-size: 12px; color: hsl(var(--muted-foreground))">
              {{ $t('page.leave.employeeLeave.form.medicalCertificateHint') }}
            </div>
          </template>
        </ElUpload>
      </ElFormItem>

      <div
        style="
          font-size: 13px;
          line-height: 1.7;
          color: hsl(var(--muted-foreground));
        "
      >
        {{ $t('page.leave.employeeLeave.form.hint') }}
      </div>
    </ElForm>
  </Modal>
</template>
