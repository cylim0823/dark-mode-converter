export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampByte(value: number): number {
  return Math.round(clamp(value, 0, 255));
}

export function blendChannel(start: number, end: number, amount: number): number {
  return clampByte(start + (end - start) * amount);
}

export function blendRgb(start: Rgb, end: Rgb, amount: number): Rgb {
  return {
    r: blendChannel(start.r, end.r, amount),
    g: blendChannel(start.g, end.g, amount),
    b: blendChannel(start.b, end.b, amount),
  };
}

export function invertRgb(color: Rgb): Rgb {
  return {
    r: 255 - color.r,
    g: 255 - color.g,
    b: 255 - color.b,
  };
}

export function getPerceivedBrightness(color: Rgb): number {
  return color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
}

export function getRelativeLuminance(color: Rgb): number {
  const r = srgbToLinear(color.r / 255);
  const g = srgbToLinear(color.g / 255);
  const b = srgbToLinear(color.b / 255);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(first: Rgb, second: Rgb): number {
  const firstLuminance = getRelativeLuminance(first);
  const secondLuminance = getRelativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getChroma(color: Rgb): number {
  return Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b);
}

export function rgbToHsl(color: Rgb): Hsl {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l };
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h = 0;

  if (max === r) {
    h = ((g - b) / delta) % 6;
  } else if (max === g) {
    h = (b - r) / delta + 2;
  } else {
    h = (r - g) / delta + 4;
  }

  return {
    h: (h * 60 + 360) % 360,
    s,
    l,
  };
}

export function hslToRgb(color: Hsl): Rgb {
  const c = (1 - Math.abs(2 * color.l - 1)) * color.s;
  const x = c * (1 - Math.abs(((color.h / 60) % 2) - 1));
  const m = color.l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (color.h < 60) {
    r = c;
    g = x;
  } else if (color.h < 120) {
    r = x;
    g = c;
  } else if (color.h < 180) {
    g = c;
    b = x;
  } else if (color.h < 240) {
    g = x;
    b = c;
  } else if (color.h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: clampByte((r + m) * 255),
    g: clampByte((g + m) * 255),
    b: clampByte((b + m) * 255),
  };
}

function srgbToLinear(value: number): number {
  if (value <= 0.03928) {
    return value / 12.92;
  }

  return ((value + 0.055) / 1.055) ** 2.4;
}
