import CoreGraphics
import CoreML
import CoreVideo
import Foundation
import UIKit

/// DEBUG-only: loads `pigment_segmentation.mlmodelc` from the app bundle and runs one forward pass.
/// Logs to the Xcode console. Does not block UI if called from `runIfDebug()` (uses a background queue).
/// Note: `expo prebuild --clean` can regenerate `ios/`; re-add this file to the target if needed.
@objc(PigmentSegmentationSmoke)
public final class PigmentSegmentationSmoke: NSObject {
  @objc public static func runIfDebug() {
#if DEBUG
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try runSync()
      } catch {
        print("[PigmentSegmentationSmoke] FAILED: \(error)")
      }
    }
#endif
  }

  private static func runSync() throws {
    guard let url = Bundle.main.url(forResource: "pigment_segmentation", withExtension: "mlmodelc") else {
      throw NSError(
        domain: "PigmentSegmentationSmoke",
        code: 1,
        userInfo: [NSLocalizedDescriptionKey: "Missing pigment_segmentation.mlmodelc in app bundle"]
      )
    }

    let config = MLModelConfiguration()
    config.computeUnits = .all
    let model = try MLModel(contentsOf: url, configuration: config)

    let cgImage = try Self.solidColorCGImage(width: 512, height: 512)
    let input = try MLFeatureValue(
      cgImage: cgImage,
      pixelsWide: 512,
      pixelsHigh: 512,
      pixelFormatType: kCVPixelFormatType_32BGRA,
      options: [:]
    )
    let provider = try MLDictionaryFeatureProvider(dictionary: ["input_image": input])
    let output = try model.prediction(from: provider)

    let keys = output.featureNames.sorted().joined(separator: ", ")
    print("[PigmentSegmentationSmoke] OK — output feature names: \(keys)")

    if let mask = output.featureValue(for: "pigment_mask")?.multiArrayValue {
      let shape = mask.shape.map { $0.intValue }.map(String.init).joined(separator: " × ")
      print("[PigmentSegmentationSmoke] pigment_mask shape: \(shape)")
    } else if output.featureValue(for: "pigment_mask") != nil {
      print("[PigmentSegmentationSmoke] pigment_mask present (not a multi-array — check model I/O in Xcode]")
    } else {
      print("[PigmentSegmentationSmoke] warning: no feature named pigment_mask")
    }
  }

  private static func solidColorCGImage(width: Int, height: Int) throws -> CGImage {
    let size = CGSize(width: width, height: height)
    UIGraphicsBeginImageContextWithOptions(size, false, 1.0)
    UIColor.systemPink.setFill()
    UIRectFill(CGRect(origin: .zero, size: size))
    let image = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()
    guard let cg = image?.cgImage else {
      throw NSError(
        domain: "PigmentSegmentationSmoke",
        code: 2,
        userInfo: [NSLocalizedDescriptionKey: "Failed to create CGImage"]
      )
    }
    return cg
  }
}
