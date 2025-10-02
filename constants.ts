
import { SelectOption } from './types';

export const IMAGE_TYPES: SelectOption[] = [
  { value: 'exterior', label: 'Exterior' },
  { value: 'interior', label: 'Interior' },
];

export const COLOR_STYLES: SelectOption[] = [
  { value: 'Modern + Elegant', label: 'Modern & Elegant' },
  { value: 'Luxury', label: 'Luxury' },
  { value: 'Classic', label: 'Classic' },
  { value: 'Minimalist', label: 'Minimalist' },
  { value: 'Vibrant & Bold', label: 'Vibrant & Bold' },
  { value: 'Cozy & Warm', label: 'Cozy & Warm' },
];

export const PAINT_TYPES: SelectOption[] = [
  { value: 'Plastic Paint', label: 'Plastic Paint' },
  { value: 'Water Paint', label: 'Water Paint' },
  { value: 'Matte Finish', label: 'Matte Finish' },
  { value: 'Glossy Finish', label: 'Glossy Finish' },
];
