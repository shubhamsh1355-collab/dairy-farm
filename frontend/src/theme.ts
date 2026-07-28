// Design tokens for Ksheer Dhara (source: /app/design_guidelines.json)
export const colors = {
  surface: "#FAF9F6",
  onSurface: "#1C1B1A",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#1C1B1A",
  surfaceTertiary: "#F0EBE1",
  onSurfaceTertiary: "#4A4743",
  surfaceInverse: "#24221F",
  onSurfaceInverse: "#FAF9F6",
  brand: "#275C3B",
  brandPrimary: "#275C3B",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#B55A30",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E2EBE5",
  onBrandTertiary: "#193D27",
  success: "#2E6B3B",
  warning: "#D98F2B",
  error: "#BA3B3B",
  info: "#2B6B8A",
  border: "#E6E2D8",
  borderStrong: "#CFC9BC",
  divider: "#E6E2D8",
  muted: "#8A857D",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  sm: 12,
  base: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  display: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: "#1C1B1A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const images = {
  hero_farm:
    "https://images.pexels.com/photos/34153986/pexels-photo-34153986.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  milk_splash:
    "https://images.pexels.com/photos/7429050/pexels-photo-7429050.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  farm_sunset:
    "https://images.unsplash.com/photo-1567510534272-07e0f621b6d3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwxfHxkYWlyeSUyMGZhcm0lMjBzdW5zZXQlMjBsYW5kc2NhcGV8ZW58MHx8fHwxNzg0NjMzNTc1fDA&ixlib=rb-4.1.0&q=85",
} as const;
