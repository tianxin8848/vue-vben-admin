<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';

import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { useUserStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { useVbenForm, z } from '#/adapter/form';
import { changePasswordApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'ChangeInitialPassword' });

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.currentPasswordTip'),
      },
      fieldName: 'current_password',
      label: $t('authentication.currentPassword'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.currentPasswordTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.newPasswordTip'),
      },
      fieldName: 'new_password',
      label: $t('authentication.newPassword'),
      rules: z
        .string()
        .min(6, { message: $t('authentication.newPasswordTip') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.confirmPasswordTip'),
      },
      fieldName: 'confirm_password',
      label: $t('authentication.confirmPassword'),
      dependencies: {
        rules(values) {
          const { new_password } = values;
          return z
            .string({
              required_error: $t('authentication.confirmPasswordTip'),
            })
            .min(1, { message: $t('authentication.confirmPasswordTip') })
            .refine((value) => value === new_password, {
              message: $t('authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['new_password'],
      },
    },
  ];
});

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      hideLabel: true,
      hideRequiredMark: true,
    },
    schema: formSchema,
    showDefaultActions: false,
  }),
);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const values = await formApi.getValues();
  try {
    loading.value = true;
    await changePasswordApi({
      current_password: values.current_password,
      new_password: values.new_password,
    });
    ElMessage.success($t('authentication.passwordChangeSuccess'));
    // 刷新用户信息，清除 is_initial_password 标记
    await authStore.fetchUserInfo();
    const homePath = userStore.userInfo?.homePath || '/employee';
    await router.replace(homePath);
  } catch {
    // 错误信息已由响应拦截器统一提示
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div @keydown.enter.prevent="handleSubmit">
    <div class="mb-6">
      <h2 class="text-xl font-semibold">
        {{ $t('authentication.changeInitialPassword') }}
      </h2>
      <p class="mt-2 text-sm text-muted-foreground">
        {{ $t('authentication.changeInitialPasswordSubtitle') }}
      </p>
    </div>

    <Form />

    <VbenButton
      :class="{ 'cursor-wait': loading }"
      :loading="loading"
      aria-label="submit"
      class="mt-2 w-full"
      @click="handleSubmit"
    >
      {{ $t('authentication.confirmChange') }}
    </VbenButton>
  </div>
</template>
