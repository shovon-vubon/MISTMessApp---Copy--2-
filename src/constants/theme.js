export const COLORS = {
  bg:       '#0F1218',
  bg2:      '#161B24',
  bg3:      '#1D2535',
  border:   '#2A3245',
  gold:     '#B8922A',
  goldDim:  '#8A6B1E',
  goldLight:'#D4A843',
  text:     '#E8E8E8',
  text2:    '#9BA3B5',
  text3:    '#5C6478',
  amber:    '#D29922',
  amberBg:  'rgba(210,153,34,0.12)',
  green:    '#3DA35D',
  greenBg:  'rgba(61,163,93,0.12)',
  red:      '#C94040',
  redBg:    'rgba(201,64,64,0.12)',
  blue:     '#3B82C4',
  blueBg:   'rgba(59,130,196,0.12)',
};

export const PAPER_THEME = {
  dark: true,
  colors: {
    primary:          COLORS.gold,
    onPrimary:        '#000',
    primaryContainer: COLORS.goldDim,
    secondary:        COLORS.text2,
    background:       COLORS.bg,
    surface:          COLORS.bg2,
    surfaceVariant:   COLORS.bg3,
    onSurface:        COLORS.text,
    onSurfaceVariant: COLORS.text2,
    outline:          COLORS.border,
    error:            COLORS.red,
    onError:          '#fff',
    elevation: {
      level0: COLORS.bg,
      level1: COLORS.bg2,
      level2: COLORS.bg3,
      level3: '#222B3A',
      level4: '#263040',
      level5: '#2A3448',
    },
  },
};

export const FONT = {
  head: 'System',
};
