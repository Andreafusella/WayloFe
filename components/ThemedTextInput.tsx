import { forwardRef, useCallback } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { hapticImpact } from '@/utils/haptics';

export type ThemedTextInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

const ThemedTextInput = forwardRef<TextInput, ThemedTextInputProps>(function ThemedTextInput(
  { style, lightColor, darkColor, onFocus, ...rest },
  ref,
) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      void hapticImpact('light');
      onFocus?.(e);
    },
    [onFocus],
  );

  return <TextInput ref={ref} {...rest} style={[{ color }, style]} onFocus={handleFocus} />;
});

ThemedTextInput.displayName = 'ThemedTextInput';

export default ThemedTextInput;
