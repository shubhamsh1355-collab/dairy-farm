// Design tokens for Ksheer Dhara (source: /app/design_guidelines.json)
export const colors = {
  surface: "#F9FAFB",
  onSurface: "#111827",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#111827",
  surfaceTertiary: "#F3F4F6",
  onSurfaceTertiary: "#4B5563",
  surfaceInverse: "#1F2937",
  onSurfaceInverse: "#F9FAFB",
  brand: "#065F46",
  brandPrimary: "#065F46",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#B45309",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#D1FAE5",
  onBrandTertiary: "#064E3B",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
  info: "#0284C7",
  border: "#E5E7EB",
  borderStrong: "#D1D5DB",
  divider: "#E5E7EB",
  muted: "#6B7280",
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
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
