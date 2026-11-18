import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, type FieldPath } from 'react-hook-form';
import { View, type TextInputProps } from 'react-native';

import { Button } from '@/components/buttons/button';
import { AppText } from '@/components/common/app-text';
import { InlineAlert } from '@/components/common/inline-alert';
import { ProgressBar } from '@/components/common/progress-bar';
import { ErrorState, LoadingView } from '@/components/common/state-message';
import { TextField } from '@/components/inputs/text-field';
import { PageHeader } from '@/components/layouts/page-header';
import { Screen } from '@/components/layouts/screen';
import { useCurrentMember } from '@/features/auth';
import { getErrorMessage } from '@/services/api';
import { makeStyles } from '@/theme';
import type { Member } from '@/types/member';

import { ProfileAvatar } from '../components/profile-avatar';
import { pickProfileImage, useUpdateProfile } from '../hooks/use-profile';
import type { UploadImage } from '../types';
import { profileSchema, type ProfileFormInput, type ProfileFormValues } from '../validation/profile-schema';

export function EditProfileScreen() {
  const member = useCurrentMember();
  return (
    <Screen keyboardAware edges={['top', 'left', 'right', 'bottom']}>
      <PageHeader back title="Edit profile" />
      {member.data ? (
        <EditProfileForm member={member.data} />
      ) : member.isError ? (
        <ErrorState message={getErrorMessage(member.error)} onRetry={() => void member.refetch()} />
      ) : (
        <LoadingView message="Loading your profile…" />
      )}
    </Screen>
  );
}

type FieldConfig = { name: FieldPath<ProfileFormInput>; label: string; hint?: string; inputProps: Partial<TextInputProps> };

const fields: FieldConfig[] = [
  {
    name: 'memberNick',
    label: 'Nickname',
    hint: 'You sign in with your nickname.',
    inputProps: { autoCapitalize: 'none', autoCorrect: false, autoComplete: 'username' },
  },
  { name: 'memberPhone', label: 'Phone number', inputProps: { keyboardType: 'phone-pad', autoComplete: 'tel' } },
  {
    name: 'memberAddress',
    label: 'Address',
    inputProps: { multiline: true, autoComplete: 'street-address', textAlignVertical: 'top' },
  },
  { name: 'memberDesc', label: 'About you', inputProps: { multiline: true, textAlignVertical: 'top' } },
];

function EditProfileForm({ member }: { member: Member }) {
  const styles = useStyles();
  const update = useUpdateProfile();
  const [image, setImage] = useState<UploadImage | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const { control, handleSubmit, formState } = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      memberNick: member.memberNick,
      memberPhone: member.memberPhone,
      memberAddress: member.memberAddress ?? '',
      memberDesc: member.memberDesc ?? '',
    },
  });

  const choosePhoto = async () => {
    if (picking) return;
    setPicking(true);
    setImageError(null);
    try {
      const result = await pickProfileImage();
      if (result.kind === 'picked') setImage(result.image);
      if (result.kind === 'invalid') setImageError(result.message);
    } catch {
      setImageError('The photo library could not be opened.');
    } finally {
      setPicking(false);
    }
  };

  const onSave = handleSubmit((values) =>
    update.mutate({ fields: values, image: image ?? undefined }, { onSuccess: () => router.back() }),
  );

  const hasChanges = formState.isDirty || image !== null;

  return (
    <View style={styles.body}>
      <View style={styles.photoRow}>
        <ProfileAvatar
          nickname={member.memberNick}
          imagePath={image?.uri ?? member.memberImage}
          isLocal={Boolean(image)}
          size={88}
        />
        <View style={styles.photoActions}>
          <Button title={image ? 'Choose another photo' : 'Change photo'} icon="camera" variant="secondary" onPress={() => void choosePhoto()} loading={picking} />
          {image ? <Button title="Keep current photo" variant="ghost" onPress={() => setImage(null)} /> : null}
          <AppText variant="caption" tone="muted">
            JPEG, PNG or WEBP, up to 5 MB.
          </AppText>
        </View>
      </View>
      {imageError ? <InlineAlert message={imageError} /> : null}

      {fields.map((field) => (
        <Controller
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label={field.label}
              hint={field.hint}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={formState.errors[field.name]?.message}
              {...field.inputProps}
            />
          )}
        />
      ))}

      {update.isError ? <InlineAlert message={getErrorMessage(update.error)} /> : null}
      {update.isPending && update.progress !== null ? <ProgressBar value={update.progress} label="Uploading photo" /> : null}

      <Button
        title="Save changes"
        icon="check"
        fullWidth
        loading={update.isPending}
        disabled={!hasChanges || update.isPending}
        onPress={() => void onSave()}
        testID="save-profile"
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { paddingHorizontal: t.spacing.xl, gap: t.spacing.lg },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg },
  photoActions: { flex: 1, gap: t.spacing.xs, alignItems: 'flex-start' },
}));
