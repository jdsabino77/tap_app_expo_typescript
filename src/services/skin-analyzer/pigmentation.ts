/**
 * Pigmentation / skin analyzer — JS facade.
 * iOS: local Expo module `tap-skin-analyzer` runs bundled Core ML (`pigment_segmentation`).
 */

import { analyzePigmentationNative } from "tap-skin-analyzer";
import { Platform } from "react-native";

import type { ConditionAreaEstimate } from "./conditionTypes";

export type { ConditionAreaEstimate } from "./conditionTypes";

export type PigmentAnalysisResult = {
  maskBase64?: string;
  affectedPercent?: number;
  /** From multi-class / exclusive export — when absent, UI may show preview stubs. */
  conditions?: ConditionAreaEstimate[];
};

export class SkinAnalyzerNotAvailableError extends Error {
  constructor(message = "Skin analyzer is not available in this build or platform.") {
    super(message);
    this.name = "SkinAnalyzerNotAvailableError";
  }
}

export function isSkinAnalyzerNotAvailableError(e: unknown): e is SkinAnalyzerNotAvailableError {
  return e instanceof SkinAnalyzerNotAvailableError;
}

/**
 * Run on-device pigmentation segmentation (iOS + dev build with model bundled).
 */
export async function analyzePigmentation(imageUri: string): Promise<PigmentAnalysisResult> {
  if (Platform.OS !== "ios") {
    throw new SkinAnalyzerNotAvailableError("Skin analyzer runs on iOS only (Core ML).");
  }

  try {
    return await analyzePigmentationNative(imageUri);
  } catch (e) {
    if (e instanceof SkinAnalyzerNotAvailableError) throw e;
    const message = e instanceof Error ? e.message : String(e);
    throw new SkinAnalyzerNotAvailableError(
      `Native analyzer failed (rebuild iOS after adding tap-skin-analyzer / model): ${message}`
    );
  }
}
