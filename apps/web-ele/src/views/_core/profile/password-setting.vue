<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { toastSuccess } from '#/utils/message';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERNS,
  passwordMessages,
  passwordRequirements,
} from '#/utils/password-policy';

const formSchema = computed((): VbenFormSchema[] => {
  const messages = passwordMessages();
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
        passwordRequirements: passwordRequirements(),
        placeholder: $t('profile.enterNewPassword'),
      },
      rules: z
        .string({ required_error: messages.required })
        .min(PASSWORD_MIN_LENGTH, { message: messages.tooShort })
        .regex(PASSWORD_PATTERNS.lowercase, { message: messages.lowercase })
        .regex(PASSWORD_PATTERNS.uppercase, { message: messages.uppercase })
        .regex(PASSWORD_PATTERNS.special, { message: messages.special }),
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
  toastSuccess($t('profile.passwordChanged'));
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
