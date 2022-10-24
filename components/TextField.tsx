import { FormControl, HStack, Input, Text } from '@chakra-ui/react';
import React, { ChangeEventHandler } from 'react';

interface TextFieldProps {
  domId: string;
  label?: string;
  inputType?: string;
  inputProps?: {};
  containerProps?: {};
  placeholder?: string;
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  children?: React.ReactNode;
}

export default function TextField({
  domId,
  label,
  inputType,
  placeholder,
  value,
  onChange,
  children,
  inputProps,
  containerProps = {},
}: TextFieldProps) {
  const [isFocused, setIsFocused] = React.useState<boolean>(false);
  const textFieldInputProps = {
    textStyle: 'body2',
    color: 'cld.fg1',
    fontSize: '0.875rem',
    _placeholder: { color: 'cld.fg4' },
    focusBorderColor: 'cld.fg1',
    borderColor: 'cld.separator2',
    variant: 'flushed',
    ...inputProps,
  };

  const { __focus: focusContainerProps, ...rest } = containerProps as any;
  const finalContainerProps = {
    ...rest,
    ...(isFocused ? focusContainerProps : {}),
  };

  return (
    <FormControl id={domId}>
      {label && (
        <Text textStyle="h5-mono" color="cld.fg1" textTransform="uppercase" pb="0">
          {label}
        </Text>
      )}
      <HStack spacing="0" {...finalContainerProps}>
        <Input
          placeholder={placeholder}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={(e) => setIsFocused(true)}
          onBlur={(e) => setIsFocused(false)}
          {...textFieldInputProps}
        />
        {children}
      </HStack>
    </FormControl>
  );
}
