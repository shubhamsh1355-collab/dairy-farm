import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function useIconFonts() {
  const [loaded, error] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  return [loaded, error] as const;
}
