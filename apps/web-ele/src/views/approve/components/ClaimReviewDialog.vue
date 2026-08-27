<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { reviewClaimApi } from '#/api';
import { $t } from '#/locales';

const props = defineProps<{
  current: ClaimApi.ClaimResponse | null;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  confirmed: [];
  'update:modelValue': [value: boolean];
}>();

const form = reactive({ reviewComment: '' });
const rejectedItemIds = ref<string[]>([]);
const submitting = ref(false);

function reset() {
  form.reviewComment = '';
  rejectedItemIds.value = [];
}

async function submit(action: 'approved' | 'rejected') {
  if (!props.current) return;
  if (action === 'rejected' && !form.reviewComment.trim()) {
    ElMessage.warning($t('page.approve.claimReview.rejectRequired'));
    return;
  }
  submitting.value = true;
  try {
    await reviewClaimApi(props.current.id, {
      approval_status: action,
      rejected_item_ids:
        action === 'rejected' && rejectedItemIds.value.length > 0
          ? rejectedItemIds.value
          : undefined,
      review_comment: form.reviewComment.trim() || null,
    });
    ElMessage.success(
      action === 'approved'
        ? $t('page.approve.claimReview.approved')
        : $t('page.approve.claimReview.rejected'),
    );
    emit('update:modelValue', false);
    emit('confirmed');
    reset();
  } catch {
    ElMessage.error($t('page.approve.claimReview.operateFailed'));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="$t('page.approve.claimReview.title')"
    width="640px"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="reset"
  >
    <div v-if="current" style="padding: 10px 0">
      <p>
        {{
          $t('page.approve.claimReview.applicant', {
            name: current.employee_name,
            username: current.employee_username,
          })
        }}
      </p>
      <p>
        {{
          $t('page.approve.claimReview.reason', {
            reason: current.reason_label,
            amount: current.amount.toFixed(2),
            currency: current.currency,
          })
        }}
        <span v-if="current.amount_hkd" class="text-xs text-muted-foreground">
          {{
            $t('page.approve.claimReview.amountHkd', {
              amount: current.amount_hkd.toFixed(2),
            })
          }}
        </span>
      </p>

      <div v-if="current.items && current.items.length > 0" class="mt-2">
        <div class="mb-2 text-sm font-medium">
          {{ $t('page.approve.claimReview.itemsTitle') }}
        </div>
        <ElCheckboxGroup v-model="rejectedItemIds">
          <div
            v-for="(it, idx) in current.items"
            :key="it.item_id ?? idx"
            class="mb-2 rounded border p-2"
          >
            <ElCheckbox
              v-if="it.item_id"
              :value="it.item_id"
              :label="it.item_id"
            >
              <span class="font-medium">{{ it.reason_label }}</span>
              <span class="ml-2">
                {{ it.amount.toFixed(2) }} {{ it.currency }}
                <span
                  v-if="it.amount_hkd"
                  class="text-xs text-muted-foreground"
                >
                  {{
                    $t('page.approve.claimReview.amountHkd', {
                      amount: it.amount_hkd.toFixed(2),
                    })
                  }}
                </span>
              </span>
            </ElCheckbox>
            <div v-else class="font-medium">
              {{ it.reason_label }}
              <span class="ml-2">
                {{ it.amount.toFixed(2) }} {{ it.currency }}
              </span>
            </div>
            <div
              v-if="it.description || it.invoice_date || it.invoice_no"
              class="ml-6 text-xs text-muted-foreground"
            >
              <div v-if="it.description">{{ it.description }}</div>
              <div v-if="it.invoice_date || it.invoice_no" class="mt-0-5">
                <span v-if="it.invoice_date">
                  {{
                    $t('page.approve.claimReview.itemInvoiceDate', {
                      date: it.invoice_date,
                    })
                  }}
                </span>
                <span v-if="it.invoice_no" class="ml-2">
                  {{
                    $t('page.approve.claimReview.itemInvoiceNo', {
                      no: it.invoice_no,
                    })
                  }}
                </span>
              </div>
            </div>
            <div class="ml-6">
              <a
                v-if="it.attachment_url"
                :href="it.attachment_url"
                target="_blank"
                class="text-xs"
              >
                {{
                  it.attachment_name ||
                  $t('page.approve.claimReview.viewAttachment')
                }}
              </a>
            </div>
          </div>
        </ElCheckboxGroup>
      </div>

      <ElForm :model="form" label-width="80px" style="margin-top: 16px">
        <ElFormItem :label="$t('page.approve.claimReview.reviewComment')">
          <ElInput
            v-model="form.reviewComment"
            type="textarea"
            :rows="4"
            :placeholder="$t('page.approve.claimReview.reviewPlaceholder')"
          />
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">
{{
        $t('page.approve.claimReview.cancel')
      }}
</ElButton>
      <ElButton type="danger" :loading="submitting" @click="submit('rejected')">
        {{ $t('page.approve.claimReview.reject') }}
      </ElButton>
      <ElButton
        type="primary"
        :loading="submitting"
        @click="submit('approved')"
      >
        {{ $t('page.approve.claimReview.approve') }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.text-xs {
  font-size: 12px;
}

.text-muted-foreground {
  color: #94a3b8;
}

.ml-2 {
  margin-left: 8px;
}

.ml-6 {
  margin-left: 24px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-0-5 {
  margin-top: 2px;
}

.mb-2 {
  margin-bottom: 8px;
}

.rounded {
  border-radius: 4px;
}

.border {
  border: 1px solid #e5e7eb;
}

.p-2 {
  padding: 8px;
}

.font-medium {
  font-weight: 500;
}

.text-sm {
  font-size: 14px;
}
</style>
