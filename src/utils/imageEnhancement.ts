export type ImageFilterType = 
  | 'none' 
  | 'grayscale' 
  | 'contrast' 
  | 'brighten' 
  | 'document' 
  | 'warm' 
  | 'sharpen' 
  | 'inverted';

export interface ImageEnhancementFilter {
  id: ImageFilterType;
  label: string;
  shortLabel: string;
  emoji: string;
  cssFilter: string;
  description: string;
  badge?: string;
}

export const HOMEWORK_IMAGE_FILTERS: ImageEnhancementFilter[] = [
  {
    id: 'none',
    label: 'Original',
    shortLabel: 'Normal',
    emoji: '📷',
    cssFilter: 'none',
    description: 'Natural unfiltered camera feed'
  },
  {
    id: 'document',
    label: 'Document Scan',
    shortLabel: 'Doc Scan',
    emoji: '📄',
    cssFilter: 'grayscale(70%) contrast(175%) brightness(115%)',
    description: 'High clarity & crisp text for notebook homework',
    badge: 'Recommended'
  },
  {
    id: 'grayscale',
    label: 'Grayscale (B&W)',
    shortLabel: 'Grayscale',
    emoji: '⚫',
    cssFilter: 'grayscale(100%) contrast(135%) brightness(105%)',
    description: 'Classic monochrome print look to eliminate shadow tints'
  },
  {
    id: 'contrast',
    label: 'High Contrast',
    shortLabel: 'Contrast',
    emoji: '⚡',
    cssFilter: 'contrast(190%) brightness(105%)',
    description: 'Darkens pencil & pen ink for faint handwriting'
  },
  {
    id: 'brighten',
    label: 'Brighten (Low Light)',
    shortLabel: 'Brighten',
    emoji: '☀️',
    cssFilter: 'brightness(140%) contrast(115%)',
    description: 'Lifts dark shadows & low-light desk conditions'
  },
  {
    id: 'warm',
    label: 'Warm Light',
    shortLabel: 'Warm',
    emoji: '💡',
    cssFilter: 'sepia(25%) brightness(110%) contrast(120%)',
    description: 'Softens harsh blue reflections from glossy pages'
  },
  {
    id: 'inverted',
    label: 'Inverted (Dark Paper)',
    shortLabel: 'Inverted',
    emoji: '🔄',
    cssFilter: 'invert(100%) contrast(150%)',
    description: 'For dark chalkboards or light ink on dark paper'
  }
];

/**
 * Applies the selected filter onto a canvas and returns the processed data URL.
 */
export function applyFilterToCanvas(
  source: HTMLVideoElement | HTMLImageElement,
  filterType: ImageFilterType,
  width?: number,
  height?: number
): string {
  const canvas = document.createElement('canvas');
  const sourceWidth = 'videoWidth' in source ? (source.videoWidth || 640) : (source.naturalWidth || 640);
  const sourceHeight = 'videoHeight' in source ? (source.videoHeight || 480) : (source.naturalHeight || 480);
  
  canvas.width = width || sourceWidth;
  canvas.height = height || sourceHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const filterObj = HOMEWORK_IMAGE_FILTERS.find((f) => f.id === filterType);
  if (filterObj && filterObj.cssFilter !== 'none') {
    ctx.filter = filterObj.cssFilter;
  } else {
    ctx.filter = 'none';
  }

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png', 0.92);
}
