<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElMessage } from 'element-plus';

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: $t('profile.oldPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('profile.enterOldPassword'),
      },
    },
    {
      fieldName: 'newPassword',
      label: $t('profile.newPassword'),
      component: 'VbenInputPassword',
      description: $t('profile.passwordHint'),
      componentProps: {
        passwordStrength: true,
        placeholder: $t('profile.enterNewPassword'),
      },
      rules: z
        .string({ required_error: $t('profile.passwordRequired') })
        .min(8, { message: $t('profile.passwordTooShort') })
        .regex(/[a-z]/, { message: $t('profile.passwordNeedLowercase') })
        .regex(/[A-Z]/, { message: $t('profile.passwordNeedUppercase') })
        .regex(/[^A-Za-z0-9]/, { message: $t('profile.passwordNeedSpecial') }),
    },
    {
      fieldName: 'confirmPassword',
      label: $t('profile.confirmPassword'),
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('profile.reEnterNewPassword'),
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: $t('profile.reEnterNewPassword') })
            .min(1, { message: $t('profile.reEnterNewPassword') })
            .refine((value) => value === newPassword, {
              message: $t('profile.passwordMismatch'),
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

function handleSubmit() {
  ElMessage.success($t('profile.passwordChanged'));
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
