import { Text, View } from 'react-native';

import { Button } from './button';

type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel: string;
  onAction: () => void;
};

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="gap-3 py-8">
      <Text className="text-lg font-semibold text-text">{title}</Text>
      {message ? <Text className="text-[17px] text-text-muted">{message}</Text> : null}
      <Button label={actionLabel} onPress={onAction} className="mt-2 self-start" />
    </View>
  );
}
