import { Text, TextInput, type TextInputProps, View } from 'react-native';

type TextFieldProps = Omit<TextInputProps, 'className'> & {
  label: string;
  error?: string | null;
};

export function TextField({ label, error, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm text-text-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        className={`min-h-14 rounded-lg border bg-surface px-4 text-[17px] text-text focus:border-2 ${
          error ? 'border-danger' : 'border-border'
        }`}
        {...inputProps}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
