import { createApp, h, nextTick, ref } from 'vue';

import { expect, it } from 'vitest';

import PasswordRequirements from '../password-requirements.vue';

it('按输入实时判断每条密码要求', async () => {
  const password = ref('');
  const requirements = [
    { label: '至少 12 位', test: (value: string) => value.length >= 12 },
    { label: '包含大写字母', test: (value: string) => /[A-Z]/.test(value) },
    { label: '包含特殊字符', test: (value: string) => /[!@#]/.test(value) },
  ];

  const container = document.createElement('div');
  document.body.append(container);
  createApp({
    render: () =>
      h(PasswordRequirements, {
        password: password.value,
        requirements,
      }),
  }).mount(container);

  await nextTick();
  const items = () => [...container.querySelectorAll('li')];
  expect(items().length).toBe(3);

  const passedText = () =>
    items()
      .filter((item) => item.className.includes('text-emerald-600'))
      .map((item) => item.textContent?.trim());

  // 空密码：全部未满足
  expect(passedText()).toEqual([]);

  // 只有长度与特殊字符满足
  password.value = 'abcdefghijk!';
  await nextTick();
  expect(passedText()).toEqual(['至少 12 位', '包含特殊字符']);

  // 三条全部满足
  password.value = 'Abcdefghijk!';
  await nextTick();
  expect(passedText()).toEqual(['至少 12 位', '包含大写字母', '包含特殊字符']);
  expect(container.querySelectorAll('svg').length).toBe(6);
});
