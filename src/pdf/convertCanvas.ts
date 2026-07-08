import {
  blendRgb,
  clamp,
  getChroma,
  getContrastRatio,
  getPerceivedBrightness,
  hslToRgb,
  invertRgb,
  rgbToHsl,
  type Rgb,
} from "./colorUtils";

export type ConversionStyle = "classic" | "soft" | "contrast" | "warm";
export type RenderQuality = "low" | "high";

export interface ConversionSettings {
  style: ConversionStyle;
  strength: number;
  quality: RenderQuality;
}

interface StylePalette {
  background: Rgb;
  ink: Rgb;
  mutedInk: Rgb;
  highlightLightness: number;
  highlightSaturation: number;
  imageLightnessBias: number;
  warmth: number;
}

const STYLE_PALETTES: Record<ConversionStyle, StylePalette> = {
  classic: {
    background: { r: 10, g: 14, b: 18 },
    ink: { r: 238, g: 244, b: 248 },
    mutedInk: { r: 184, g: 194, b: 198 },
    highlightLightness: 0.34,
    highlightSaturation: 0.62,
    imageLightnessBias: 0.12,
    warmth: 0,
  },
  soft: {
    background: { r: 15, g: 24, b: 22 },
    ink: { r: 224, g: 235, b: 224 },
    mutedInk: { r: 168, g: 186, b: 176 },
    highlightLightness: 0.37,
    highlightSaturation: 0.52,
    imageLightnessBias: 0.16,
    warmth: 0.08,
  },
  contrast: {
    background: { r: 4, g: 5, b: 5 },
    ink: { r: 255, g: 255, b: 255 },
    mutedInk: { r: 220, g: 226, b: 226 },
    highlightLightness: 0.29,
    highlightSaturation: 0.72,
    imageLightnessBias: 0.08,
    warmth: 0,
  },
  warm: {
    background: { r: 20, g: 22, b: 19 },
    ink: { r: 235, g: 229, b: 210 },
    mutedInk: { r: 190, g: 183, b: 164 },
    highlightLightness: 0.34,
    highlightSaturation: 0.48,
    imageLightnessBias: 0.13,
    warmth: 0.06,
  },
};

export function getQualityScale(quality: RenderQuality): number {
  if (quality === "low") {
    return 1;
  }

  return 2;
}

export function convertPixel(r: number, g: number, b: number, settings: ConversionSettings): Rgb {
  const source = { r, g, b };
  const strength = clamp(settings.strength, 0, 100) / 100;
  const target = getTargetColor(source, settings.style);

  return blendRgb(source, target, strength);
}

export function applyDarkModeToCanvas(canvas: HTMLCanvasElement, settings: ConversionSettings): void {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("The browser could not prepare the page for conversion.");
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const converted = convertPixel(pixels[index], pixels[index + 1], pixels[index + 2], settings);
    pixels[index] = converted.r;
    pixels[index + 1] = converted.g;
    pixels[index + 2] = converted.b;
  }

  context.putImageData(imageData, 0, 0);
}

function getTargetColor(source: Rgb, style: ConversionStyle): Rgb {
  const palette = STYLE_PALETTES[style];
  const brightness = getPerceivedBrightness(source);
  const chroma = getChroma(source);
  const hsl = rgbToHsl(source);

  // The converter works on rasterized pixels, so it cannot know if a pixel is
  // text, paper, a highlight, or a photo. These heuristics prioritize common
  // document patterns: dark ink becomes light, white paper becomes dark, bright
  // highlights stay colored but muted, and image-like colors are darkened
  // without fully hue-inverting them.
  if (isPaperPixel(brightness, chroma)) {
    return palette.background;
  }

  if (isInkPixel(brightness, chroma)) {
    return getReadableInk(source, palette);
  }

  if (isHighlightPixel(brightness, chroma, hsl)) {
    return darkenHighlight(hsl, palette);
  }

  if (isImageLikePixel(brightness, chroma)) {
    return darkenImageColor(hsl, palette, style);
  }

  if (style === "classic") {
    return invertRgb(source);
  }

  if (style === "contrast") {
    return brightness > 150 ? palette.background : palette.ink;
  }

  return toneMapDocumentColor(hsl, brightness, palette);
}

function isPaperPixel(brightness: number, chroma: number): boolean {
  return brightness > 226 && chroma < 34;
}

function isInkPixel(brightness: number, chroma: number): boolean {
  return brightness < 62 && chroma < 70;
}

function isHighlightPixel(brightness: number, chroma: number, hsl: ReturnType<typeof rgbToHsl>): boolean {
  return brightness > 142 && chroma > 46 && hsl.s > 0.28;
}

function isImageLikePixel(brightness: number, chroma: number): boolean {
  return brightness >= 62 && brightness <= 226 && chroma > 42;
}

function getReadableInk(source: Rgb, palette: StylePalette): Rgb {
  if (getContrastRatio(source, palette.background) > 7) {
    return palette.mutedInk;
  }

  return palette.ink;
}

function darkenHighlight(hsl: ReturnType<typeof rgbToHsl>, palette: StylePalette): Rgb {
  return hslToRgb({
    h: hsl.h,
    s: clamp(Math.max(hsl.s * 0.8, palette.highlightSaturation), 0.32, 0.78),
    l: palette.highlightLightness,
  });
}

function darkenImageColor(hsl: ReturnType<typeof rgbToHsl>, palette: StylePalette, style: ConversionStyle): Rgb {
  if (style === "contrast") {
    return hslToRgb({
      h: hsl.h,
      s: clamp(hsl.s * 0.62, 0, 0.62),
      l: clamp(hsl.l * 0.42 + palette.imageLightnessBias, 0.12, 0.42),
    });
  }

  return hslToRgb({
    h: hsl.h,
    s: clamp(hsl.s * (0.72 - palette.warmth), 0, 0.7),
    l: clamp(hsl.l * 0.52 + palette.imageLightnessBias, 0.14, 0.5),
  });
}

function toneMapDocumentColor(hsl: ReturnType<typeof rgbToHsl>, brightness: number, palette: StylePalette): Rgb {
  const invertedLightness = 1 - brightness / 255;

  return hslToRgb({
    h: (hsl.h + palette.warmth * 24) % 360,
    s: clamp(hsl.s * 0.42 + palette.warmth, 0, 0.58),
    l: clamp(invertedLightness * 0.58 + 0.17, 0.16, 0.78),
  });
}
