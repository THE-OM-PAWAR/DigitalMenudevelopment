export interface MenuTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    vegIndicator: string;
    nonVegIndicator: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  styles: {
    borderRadius: string;
    shadow: string;
    spacing: string;
    cardStyle: string;
  };
}

export const menuThemes: MenuTheme[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimalist design with bold typography',
    preview: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      vegIndicator: '#10b981',
      nonVegIndicator: '#f59e0b',
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
    },
    styles: {
      borderRadius: '0.75rem',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      spacing: '1.5rem',
      cardStyle: 'clean',
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Elegant design with gold accents and luxury feel',
    preview: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=400',
    colors: {
      primary: '#1c1917',
      secondary: '#78716c',
      accent: '#d97706',
      background: '#fefdf9',
      surface: '#f7f6f3',
      text: '#1c1917',
      textSecondary: '#78716c',
      border: '#e7e5e4',
      vegIndicator: '#16a34a',
      nonVegIndicator: '#dc2626',
    },
    fonts: {
      heading: 'Playfair Display, serif',
      body: 'Source Sans Pro, sans-serif',
    },
    styles: {
      borderRadius: '0.5rem',
      shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      spacing: '2rem',
      cardStyle: 'elegant',
    },
  },
  {
    id: 'traditional',
    name: 'Traditional',
    description: 'Classic design with warm colors and traditional feel',
    preview: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=400',
    colors: {
      primary: '#7c2d12',
      secondary: '#a3a3a3',
      accent: '#ea580c',
      background: '#fefefe',
      surface: '#fef7ed',
      text: '#451a03',
      textSecondary: '#78716c',
      border: '#fed7aa',
      vegIndicator: '#15803d',
      nonVegIndicator: '#dc2626',
    },
    fonts: {
      heading: 'Merriweather, serif',
      body: 'Open Sans, sans-serif',
    },
    styles: {
      borderRadius: '0.375rem',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      spacing: '1.25rem',
      cardStyle: 'classic',
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Colorful and energetic design perfect for casual dining',
    preview: 'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=400',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#faf5ff',
      text: '#581c87',
      textSecondary: '#7c3aed',
      border: '#e9d5ff',
      vegIndicator: '#059669',
      nonVegIndicator: '#dc2626',
    },
    fonts: {
      heading: 'Poppins, sans-serif',
      body: 'Nunito, sans-serif',
    },
    styles: {
      borderRadius: '1rem',
      shadow: '0 8px 25px -5px rgb(0 0 0 / 0.1)',
      spacing: '1.75rem',
      cardStyle: 'playful',
    },
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Ultra-clean design with maximum white space',
    preview: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400',
    colors: {
      primary: '#000000',
      secondary: '#737373',
      accent: '#525252',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#171717',
      textSecondary: '#737373',
      border: '#f5f5f5',
      vegIndicator: '#22c55e',
      nonVegIndicator: '#ef4444',
    },
    fonts: {
      heading: 'Helvetica Neue, sans-serif',
      body: 'Helvetica Neue, sans-serif',
    },
    styles: {
      borderRadius: '0.25rem',
      shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      spacing: '2.5rem',
      cardStyle: 'minimal',
    },
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Sleek dark theme with neon accents',
    preview: 'https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=400',
    colors: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      accent: '#06b6d4',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#d1d5db',
      border: '#374151',
      vegIndicator: '#10b981',
      nonVegIndicator: '#f59e0b',
    },
    fonts: {
      heading: 'Roboto, sans-serif',
      body: 'Roboto, sans-serif',
    },
    styles: {
      borderRadius: '0.5rem',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)',
      spacing: '1.5rem',
      cardStyle: 'dark',
    },
  },
];

export const getThemeById = (themeId: string): MenuTheme => {
  return menuThemes.find(theme => theme.id === themeId) || menuThemes[0];
};

export const generateThemeCSS = (theme: MenuTheme): string => {
  return `
    :root {
      --theme-primary: ${theme.colors.primary};
      --theme-secondary: ${theme.colors.secondary};
      --theme-accent: ${theme.colors.accent};
      --theme-background: ${theme.colors.background};
      --theme-surface: ${theme.colors.surface};
      --theme-text: ${theme.colors.text};
      --theme-text-secondary: ${theme.colors.textSecondary};
      --theme-border: ${theme.colors.border};
      --theme-veg: ${theme.colors.vegIndicator};
      --theme-non-veg: ${theme.colors.nonVegIndicator};
      --theme-font-heading: ${theme.fonts.heading};
      --theme-font-body: ${theme.fonts.body};
      --theme-border-radius: ${theme.styles.borderRadius};
      --theme-shadow: ${theme.styles.shadow};
      --theme-spacing: ${theme.styles.spacing};
    }
  `;
};