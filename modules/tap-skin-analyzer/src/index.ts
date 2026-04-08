import { requireNativeModule } from "expo-modules-core";

export type NativePigmentAnalysisResult = {
  maskBase64: string;
  affectedPercent: number;
};

interface TapSkinAnalyzerNativeModule {
  analyzePigmentation(imageUri: string): Promise<NativePigmentAnalysisResult>;
}

let nativeModule: TapSkinAnalyzerNativeModule | null = null;

function getNativeModule(): TapSkinAnalyzerNativeModule {
  if (nativeModule == null) {
    nativeModule = requireNativeModule<TapSkinAnalyzerNativeModule>("TapSkinAnalyzer");
  }
  return nativeModule;
}

export function analyzePigmentationNative(imageUri: string): Promise<NativePigmentAnalysisResult> {
  return getNativeModule().analyzePigmentation(imageUri);
}
