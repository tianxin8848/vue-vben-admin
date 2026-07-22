<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { ElButton, ElCol, ElForm, ElFormItem, ElRow } from 'element-plus';

interface FormItem {
  disabled?: boolean;
  label: string;
  options?: { label: string; value: any }[];
  placeholder?: string;
  prop: string;
  rules?: any[];
  span?: number;
  type:
    | 'checkbox'
    | 'date'
    | 'datetime'
    | 'input'
    | 'radio'
    | 'select'
    | 'switch'
    | 'textarea';
}

interface Props {
  disabled?: boolean;
  items: FormItem[];
  labelWidth?: string;
  model: Record<string, any>;
  title?: string;
}

interface Emits {
  reset: [];
  submit: [value: Record<string, any>];
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  labelWidth: '120px',
  disabled: false,
});

const emit = defineEmits<Emits>();

const formRef = ref();
const formData = reactive({ ...props.model });

watch(
  () => props.model,
  (val) => {
    Object.assign(formData, val);
  },
  { deep: true },
);

function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      emit('submit', { ...formData });
    }
  });
}

function handleReset() {
  formRef.value.resetFields();
  emit('reset');
}
</script>

<template>
  <div class="base-form-wrapper">
    <h3 v-if="title" class="form-title">{{ title }}</h3>
    <ElForm
      ref="formRef"
      :model="formData"
      :label-width="labelWidth"
      label-position="right"
    >
      <template v-for="item in items" :key="item.prop">
        <ElRow :gutter="20">
          <ElCol :span="item.span || 24">
            <ElFormItem
              :label="item.label"
              :prop="item.prop"
              :rules="item.rules"
            >
              <template v-if="item.type === 'input'">
                <input
                  v-model="formData[item.prop]"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled || props.disabled"
                  class="el-input__inner"
                />
              </template>
              <template v-else-if="item.type === 'select'">
                <select
                  v-model="formData[item.prop]"
                  :disabled="item.disabled || props.disabled"
                  class="el-select"
                >
                  <option value="" disabled>
                    {{ item.placeholder || '请选择' }}
                  </option>
                  <option
                    v-for="opt in item.options"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </template>
              <template v-else-if="item.type === 'textarea'">
                <textarea
                  v-model="formData[item.prop]"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled || props.disabled"
                  rows="4"
                  class="el-textarea__inner"
                ></textarea>
              </template>
              <template v-else-if="item.type === 'switch'">
                <span
                  class="el-switch"
                  :class="[{ 'is-checked': formData[item.prop] }]"
                >
                  <span class="el-switch__core">
                    <span class="el-switch__action"></span>
                  </span>
                  <input
                    type="checkbox"
                    v-model="formData[item.prop]"
                    :disabled="item.disabled || props.disabled"
                  />
                </span>
              </template>
              <template v-else>
                <input
                  v-model="formData[item.prop]"
                  :type="item.type"
                  :placeholder="item.placeholder"
                  :disabled="item.disabled || props.disabled"
                  class="el-input__inner"
                />
              </template>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </template>
      <ElRow>
        <ElCol :span="24" class="form-actions">
          <ElButton type="primary" @click="handleSubmit">提交</ElButton>
          <ElButton @click="handleReset">重置</ElButton>
        </ElCol>
      </ElRow>
    </ElForm>
  </div>
</template>

<style scoped>
.base-form-wrapper {
  padding: 16px;
}

.form-title {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.el-input__inner,
.el-textarea__inner,
.el-select {
  width: 100%;
}
</style>
