import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { InlineAlert } from '@/components/common/inline-alert';
import { TextField, type TextFieldHandle } from '@/components/inputs/text-field';
import { useSessionStore, type SessionEndReason } from '@/store/auth/session-store';

import { AuthFormLayout } from '../components/auth-form-layout';
import { useLogin } from '../hooks/use-auth-mutations';
import { loginErrorMessage } from '../utils/auth-error-message';
import { loginSchema, type LoginFormInput, type LoginFormValues } from '../validation/auth-schemas';

const endReasonNotice: Partial<Record<SessionEndReason, string>> = {
  expired: 'Your session expired. Please sign in again.',
  unauthorized: 'Your session is no longer valid. Please sign in again.',
  inactive: 'This account is no longer active. Please contact BURAK.',
};

export function LoginScreen() {
  const login = useLogin();
  const lastEndReason = useSessionStore((state) => state.lastEndReason);
  const passwordRef = useRef<TextFieldHandle>(null);
  const { control, handleSubmit, formState } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { memberNick: '', memberPassword: '' },
  });

  // On success the session store flips to "authenticated" and the root guard navigates.
  const onSubmit = handleSubmit((values) => login.mutate(values));
  const notice = lastEndReason ? endReasonNotice[lastEndReason] : undefined;

  return (
    <AuthFormLayout
      title="Welcome back"
      subtitle="Sign in with the nickname you registered with."
      footer={
        <Link href="/register" replace>
          <AppText tone="muted">
            New to BURAK? <AppText tone="primary" variant="bodyStrong">Create an account</AppText>
          </AppText>
        </Link>
      }
    >
      {notice && !login.isError ? <InlineAlert tone="info" message={notice} /> : null}
      {login.isError ? <InlineAlert message={loginErrorMessage(login.error)} /> : null}

      <Controller
        control={control}
        name="memberNick"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Nickname"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={formState.errors.memberNick?.message}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
          />
        )}
      />
      <Controller
        control={control}
        name="memberPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            ref={passwordRef}
            label="Password"
            password
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={formState.errors.memberPassword?.message}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
      />
      <Button title="Sign in" onPress={() => void onSubmit()} loading={login.isPending} fullWidth testID="login-submit" />
    </AuthFormLayout>
  );
}
