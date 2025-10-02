
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { OptionSelector } from './components/OptionSelector';
import { ResultDisplay } from './components/ResultDisplay';
import { Loader } from './components/Loader';
import { PaintBrushIcon } from './components/icons/PaintBrushIcon';
import { analyzeAndRecolorImage } from './services/geminiService';
import { UserPreferences, AnalysisResult } from './types';
import { COLOR_STYLES, IMAGE_TYPES, PAINT_TYPES } from './constants';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    imageType: IMAGE_TYPES[0].value,
    colorStyle: COLOR_STYLES[0].value,
    paintType: PAINT_TYPES[0].value,
  });
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((file: File, previewUrl: string) => {
    setUploadedImage(file);
    setImagePreviewUrl(previewUrl);
    setResult(null);
    setError(null);
  }, []);

  const handlePreferenceChange = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!uploadedImage || !imagePreviewUrl) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const resultData = await analyzeAndRecolorImage(uploadedImage, preferences);
      setResult(resultData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-center">
          <PaintBrushIcon className="h-8 w-8 text-blue-500 mr-3" />
          <h1 className="text-2xl font-bold tracking-tight">Nano Banana House Painter AI</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">1. Upload & Customize</h2>
            
            <ImageUploader onImageUpload={handleImageUpload} />

            {imagePreviewUrl && (
              <div className="mt-6 space-y-4">
                <OptionSelector
                  label="Image Type"
                  value={preferences.imageType}
                  options={IMAGE_TYPES}
                  onChange={(val) => handlePreferenceChange('imageType', val)}
                />
                <OptionSelector
                  label="Desired Color Style"
                  value={preferences.colorStyle}
                  options={COLOR_STYLES}
                  onChange={(val) => handlePreferenceChange('colorStyle', val)}
                />
                <OptionSelector
                  label="Preferred Paint Type"
                  value={preferences.paintType}
                  options={PAINT_TYPES}
                  onChange={(val) => handlePreferenceChange('paintType', val)}
                />
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={!uploadedImage || isLoading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center shadow-md disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader/>
                  Analyzing & Painting...
                </>
              ) : (
                'Generate Color Scheme'
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg min-h-[600px] flex flex-col">
             <h2 className="text-xl font-semibold mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">2. AI Generated Results</h2>
            <div className="flex-grow flex items-center justify-center">
              {isLoading && (
                 <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg font-medium">Our AI is mixing the perfect colors...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This might take a moment.</p>
                </div>
              )}
              {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-4 rounded-lg">{error}</div>}
              {!isLoading && !error && result && (
                <ResultDisplay
                  originalImage={imagePreviewUrl!}
                  analysis={result.analysis}
                  newImage={result.newImage}
                />
              )}
               {!isLoading && !error && !result && (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                      <PaintBrushIcon className="h-16 w-16 mx-auto opacity-30" />
                      <p className="mt-4 text-lg">Your colorful new look will appear here.</p>
                      <p>Upload an image and set your preferences to get started!</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
