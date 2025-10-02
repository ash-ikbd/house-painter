
export interface UserPreferences {
  imageType: 'interior' | 'exterior';
  colorStyle: string;
  paintType: string;
}

export interface AnalysisResult {
  analysis: string;
  newImage: string;
}

export interface SelectOption {
    value: string;
    label: string;
}
