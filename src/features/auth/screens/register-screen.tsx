import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import type { TextInputProps } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { InlineAlert } from '@/components/common/inline-alert';
import { TextField, type TextFieldHandle } from '@/components/inputs/text-field';

import { AuthFormLayout } from '../components/auth-form-layout';
import { useSignup } from '../hooks/use-auth-mutations';
import { signupErrorMessage } from '../utils/auth-error-message';
import { signupSchema, type SignupFormInput, type SignupFormValues } from '../validation/auth-schemas';

type FieldName = FieldPath<SignupFormInput>;

const fields: {
  name: FieldName;
  label: string;
  hint?: string;
  password?: boolean;
  inputProps: Partial<TextInputProps>;
}[] = [
  {
    name: 'memberNick',
    label: 'Nickname',
    hint: 'You will use it to sign in.',
    inputProps: { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'username-new', textContentType: 'username' },
  },
  {
    name: 'memberPhone',
    label: 'Phone number',
    inputProps: { keyboardType: 'phone-pad', autoComplete: 'tel', textContentType: 'telephoneNumber' },
  },
  {
    name: 'memberPassword',
    label: 'Password',
    hint: 'At least 6 characters.',
    password: true,
    inputProps: { autoComplete: 'new-password', textContentType: 'newPassword' },
  },
  {
    name: 'confirmPassword',
    label: 'Confirm password',
    password: true,
    inputProps: { autoComplete: 'new-password', textContentType: 'newPassword' },
  },
];

export function RegisterScreen() {
  const signup = useSignup();
  const refs = useRef<Partial<Record<FieldName, TextFieldHandle | null>>>({});
  const { control, handleSubmit, formState } = useForm<SignupFormInput, unknown, SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { memberNick: '', memberPhone: '', memberPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(({ memberNick, memberPhone, memberPassword }) =>
    signup.mutate({ memberNick, memberPhone, memberPassword }),
  );

  return (
    <AuthFormLayout
      title="Create your account"
      subtitle="Join BURAK to order from the kitchen and collect points."
      footer={
        <Link href="/login" replace>
          <AppText tone="muted">
            Already registered? <AppText tone="primary" variant="bodyStrong">Sign in</AppText>
          </AppText>
        </Link>
      }
    >
      {signup.isError ? <InlineAlert message={signupErrorMessage(signup.error)} /> : null}

      {fields.map((field, index) => {
        const next = fields[index + 1];
        return (
          <Controller
            key={field.name}
            control={control}
            name={field.name}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                ref={(node) => {
                  refs.current[field.name] = node;
                }}
                label={field.label}
                hint={field.hint}
                password={field.password}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={formState.errors[field.name]?.message}
                returnKeyType={next ? 'next' : 'go'}
                submitBehavior={next ? 'submit' : undefined}
                onSubmitEditing={() => (next ? refs.current[next.name]?.focus() : void onSubmit())}
                {...field.inputProps}
              />
            )}
          />
        );
      })}

      <Button title="Create account" onPress={() => void onSubmit()} loading={signup.isPending} fullWidth testID="register-submit" />
    </AuthFormLayout>
  );
}
