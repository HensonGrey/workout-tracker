import { Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

const containerClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent border-border active:opacity-80',
  secondary: 'bg-background border-border active:bg-surface',
  destructive: 'bg-background border-danger active:bg-surface',
};

const labelClasses: Record<ButtonVariant, string> = {
  primary: 'text-on-accent',
  secondary: 'text-text',
  destructive: 'text-danger',
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Extra layout classes, e.g. `flex-1`. */
  className?: string;
};

export function Button({ label, onPress, variant = 'primary', disabled = false, className = '' }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-14 items-center justify-center rounded-lg border px-6 ${
        disabled ? 'bg-surface border-border' : containerClasses[variant]
      } ${className}`}>
      <Text className={`text-[17px] font-semibold ${disabled ? 'text-text-muted' : labelClasses[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
