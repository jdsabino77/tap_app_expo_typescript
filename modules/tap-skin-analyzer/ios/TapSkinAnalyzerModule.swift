import CoreGraphics
import CoreML
import CoreVideo
import ExpoModulesCore
import UIKit

internal final class SkinAnalyzerException: GenericException<String> {
  override var reason: String {
    param
  }
}

/// Core ML inference: must match export (`input_image` 512×512 RGB; output `pigment_mask` 1×1×512×512).
private enum PigmentCoreMLInference {
  private static let inputSize: CGFloat = 512
  private static var cachedModel: MLModel?

  static func analyze(imageUri: String) throws -> [String: Any] {
    guard let url = URL(string: imageUri), url.isFileURL else {
      throw SkinAnalyzerException("Expected a file:// image URI from the image picker.")
    }
    guard let uiImage = UIImage(contentsOfFile: url.path) else {
      throw SkinAnalyzerException("Could not load image from path.")
    }
    guard let square = resizeAspectFill(uiImage, size: inputSize), let cgImage = square.cgImage else {
      throw SkinAnalyzerException("Could not prepare 512×512 input image.")
    }

    let model = try loadModel()
    let input = try MLFeatureValue(
      cgImage: cgImage,
      pixelsWide: 512,
      pixelsHigh: 512,
      pixelFormatType: kCVPixelFormatType_32BGRA,
      options: [:]
    )
    let provider = try MLDictionaryFeatureProvider(dictionary: ["input_image": input])
    let output = try model.prediction(from: provider)

    guard let mask = output.featureValue(for: "pigment_mask")?.multiArrayValue else {
      throw SkinAnalyzerException("Model output pigment_mask missing or not a multi-array.")
    }

    let affected = computeAffectedPercent(mask: mask, threshold: 0.5)
    let maskBase64 = try encodeMaskPngBase64(mask: mask)

    return [
      "maskBase64": maskBase64,
      "affectedPercent": affected
    ]
  }

  private static func loadModel() throws -> MLModel {
    if let m = cachedModel { return m }
    guard let modelURL = Bundle.main.url(forResource: "pigment_segmentation", withExtension: "mlmodelc") else {
      throw SkinAnalyzerException("pigment_segmentation.mlmodelc not found in app bundle.")
    }
    let configuration = MLModelConfiguration()
    configuration.computeUnits = .all
    let m = try MLModel(contentsOf: modelURL, configuration: configuration)
    cachedModel = m
    return m
  }

  /// Center-crop scales image to fill a square (matches common training val resize).
  private static func resizeAspectFill(_ image: UIImage, size: CGFloat) -> UIImage? {
    let w = image.size.width
    let h = image.size.height
    guard w > 0, h > 0 else { return nil }
    let scale = max(size / w, size / h)
    let scaledW = w * scale
    let scaledH = h * scale
    let originX = (size - scaledW) / 2
    let originY = (size - scaledH) / 2

    UIGraphicsBeginImageContextWithOptions(CGSize(width: size, height: size), false, 1.0)
    defer { UIGraphicsEndImageContext() }
    image.draw(in: CGRect(x: originX, y: originY, width: scaledW, height: scaledH))
    return UIGraphicsGetImageFromCurrentImageContext()
  }

  private static func computeAffectedPercent(mask: MLMultiArray, threshold: Double) -> Double {
    let shape = mask.shape.map { $0.intValue }
    guard shape.count == 4, shape[0] == 1, shape[1] == 1 else {
      return 0
    }
    let h = shape[2]
    let w = shape[3]
    var above = 0
    let total = h * w
    for y in 0..<h {
      for x in 0..<w {
        let v = mask[[0, 0, y, x] as [NSNumber]].doubleValue
        if v >= threshold { above += 1 }
      }
    }
    return Double(above) / Double(max(total, 1)) * 100.0
  }

  private static func encodeMaskPngBase64(mask: MLMultiArray) throws -> String {
    let shape = mask.shape.map { $0.intValue }
    guard shape.count == 4, shape[0] == 1, shape[1] == 1 else {
      throw SkinAnalyzerException("Unexpected mask shape.")
    }
    let h = shape[2]
    let w = shape[3]
    var bytes = [UInt8](repeating: 0, count: w * h)
    for y in 0..<h {
      for x in 0..<w {
        let v = mask[[0, 0, y, x] as [NSNumber]].doubleValue
        let u = UInt8(clamping: Int((v * 255.0).rounded()))
        bytes[y * w + x] = u
      }
    }

    let data = Data(bytes)
    guard let provider = CGDataProvider(data: data as CFData) else {
      throw SkinAnalyzerException("Could not build mask image data.")
    }
    guard let colorSpace = CGColorSpace(name: CGColorSpace.genericGrayGamma2_2) else {
      throw SkinAnalyzerException("Could not create color space.")
    }
    guard let cgImage = CGImage(
      width: w,
      height: h,
      bitsPerComponent: 8,
      bitsPerPixel: 8,
      bytesPerRow: w,
      space: colorSpace,
      bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
      provider: provider,
      decode: nil,
      shouldInterpolate: false,
      intent: .defaultIntent
    ) else {
      throw SkinAnalyzerException("Could not create CGImage from mask.")
    }
    let uiImage = UIImage(cgImage: cgImage)
    guard let png = uiImage.pngData() else {
      throw SkinAnalyzerException("Could not encode mask as PNG.")
    }
    return png.base64EncodedString()
  }
}

public final class TapSkinAnalyzerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TapSkinAnalyzer")

    AsyncFunction("analyzePigmentation") { (imageUri: String) in
      try PigmentCoreMLInference.analyze(imageUri: imageUri)
    }
  }
}
