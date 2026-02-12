import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { WarmPalette, DarkWarmPalette, Spacing, BorderRadius, Typography } from '@/constants/theme';
import type { AppTheme } from '@/hooks/use-app-theme';

interface CoachEmailFormProps {
  email: string | null;
  coachName: string | null;
  shareEnabled: boolean;
  onSave: (email: string | null, name: string | null) => void;
  onToggleShare: (enabled: boolean) => void;
  theme?: AppTheme;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CoachEmailForm({
  email,
  coachName,
  shareEnabled,
  onSave,
  onToggleShare,
  theme = 'light',
}: CoachEmailFormProps) {
  const palette = theme === 'dark' ? DarkWarmPalette : WarmPalette;
  const [isEditing, setIsEditing] = useState(false);
  const [emailInput, setEmailInput] = useState(email || '');
  const [nameInput, setNameInput] = useState(coachName || '');

  const isValidEmail = EMAIL_REGEX.test(emailInput);
  const hasEmail = email && email.trim().length > 0;

  const handleSave = () => {
    if (emailInput.trim() && !isValidEmail) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(
      emailInput.trim() || null,
      nameInput.trim() || null
    );
    setIsEditing(false);
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Coach',
      'Are you sure you want to remove your coach?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onSave(null, null);
            onToggleShare(false);
            setEmailInput('');
            setNameInput('');
          },
        },
      ]
    );
  };

  if (!isEditing && !hasEmail) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: palette.border.light }]}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={palette.accent.primary} />
          <Text style={[styles.addButtonText, { color: palette.accent.primary }]}>Add your coach</Text>
        </TouchableOpacity>

        <Text style={[styles.explanation, { color: palette.text.secondary }]}>
          Your coach will receive a weekly summary of your reflections to help support your growth.
        </Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Coach's Name (optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: palette.border.light, color: palette.text.primary, backgroundColor: palette.background.primary }]}
            placeholder="e.g., Sarah"
            placeholderTextColor={palette.text.muted}
            value={nameInput}
            onChangeText={setNameInput}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: palette.text.secondary }]}>Coach's Email</Text>
          <TextInput
            style={[styles.input, { borderColor: palette.border.light, color: palette.text.primary, backgroundColor: palette.background.primary }, emailInput && !isValidEmail && { borderColor: palette.error }]}
            placeholder="coach@example.com"
            placeholderTextColor={palette.text.muted}
            value={emailInput}
            onChangeText={setEmailInput}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailInput && !isValidEmail && (
            <Text style={[styles.errorText, { color: palette.error }]}>Please enter a valid email</Text>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: palette.border.medium }]}
            onPress={() => {
              setIsEditing(false);
              setEmailInput(email || '');
              setNameInput(coachName || '');
            }}
          >
            <Text style={[styles.cancelButtonText, { color: palette.text.secondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: palette.accent.primary }, !isValidEmail && !emailInput && { backgroundColor: palette.border.medium }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: palette.text.inverse }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Display mode with coach info
  return (
    <View style={styles.container}>
      <View style={styles.coachCard}>
        <View style={styles.coachIcon}>
          <Ionicons name="person-circle" size={40} color={palette.accent.primary} />
        </View>
        <View style={styles.coachInfo}>
          {coachName && <Text style={[styles.coachName, { color: palette.text.primary }]}>{coachName}</Text>}
          <Text style={[styles.coachEmail, { color: palette.text.secondary }]}>{email}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Ionicons name="pencil" size={18} color={palette.text.muted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.shareRow, { borderTopColor: palette.border.light }]}>
        <View style={styles.shareInfo}>
          <Text style={[styles.shareLabel, { color: palette.text.primary }]}>Share weekly summary</Text>
          <Text style={[styles.shareSubtitle, { color: palette.text.secondary }]}>
            {shareEnabled ? 'Your coach receives weekly updates' : 'Sharing is currently paused'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.shareToggle, { backgroundColor: palette.border.light }, shareEnabled && { backgroundColor: palette.accent.muted }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleShare(!shareEnabled);
          }}
        >
          <Text style={[styles.shareToggleText, { color: palette.text.secondary }, shareEnabled && { color: palette.accent.primary }]}>
            {shareEnabled ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
        <Text style={[styles.removeButtonText, { color: palette.error }]}>Remove coach</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: WarmPalette.border.light,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
  },

  addButtonText: {
    ...Typography.body,
    color: WarmPalette.accent.primary,
    fontWeight: '500',
  },

  explanation: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
  },

  inputGroup: {
    marginBottom: Spacing.md,
  },

  inputLabel: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    marginBottom: Spacing.xs,
  },

  input: {
    borderWidth: 1,
    borderColor: WarmPalette.border.light,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: WarmPalette.text.primary,
    backgroundColor: WarmPalette.background.primary,
  },

  inputError: {
    borderColor: WarmPalette.error,
  },

  errorText: {
    ...Typography.caption,
    color: WarmPalette.error,
    marginTop: Spacing.xs,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: WarmPalette.border.medium,
  },

  cancelButtonText: {
    ...Typography.body,
    color: WarmPalette.text.secondary,
  },

  saveButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: WarmPalette.accent.primary,
  },

  saveButtonDisabled: {
    backgroundColor: WarmPalette.border.medium,
  },

  saveButtonText: {
    ...Typography.body,
    color: WarmPalette.text.inverse,
    fontWeight: '600',
  },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },

  coachIcon: {
    marginRight: Spacing.sm,
  },

  coachInfo: {
    flex: 1,
  },

  coachName: {
    ...Typography.body,
    color: WarmPalette.text.primary,
    fontWeight: '500',
  },

  coachEmail: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
  },

  editButton: {
    padding: Spacing.sm,
  },

  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: WarmPalette.border.light,
    marginTop: Spacing.sm,
  },

  shareInfo: {
    flex: 1,
  },

  shareLabel: {
    ...Typography.body,
    color: WarmPalette.text.primary,
  },

  shareSubtitle: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    marginTop: 2,
  },

  shareToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: WarmPalette.border.light,
  },

  shareToggleActive: {
    backgroundColor: WarmPalette.accent.muted,
  },

  shareToggleText: {
    ...Typography.caption,
    color: WarmPalette.text.secondary,
    fontWeight: '600',
  },

  shareToggleTextActive: {
    color: WarmPalette.accent.primary,
  },

  removeButton: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.md,
  },

  removeButtonText: {
    ...Typography.caption,
    color: WarmPalette.error,
  },
});
