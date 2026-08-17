// List on-screen Chrome window IDs and titles. Used by win_shot.sh to pick a
// window by title so screencapture -l can grab exactly that window.
import CoreGraphics
import Foundation

let opts = CGWindowListOption(arrayLiteral: .optionOnScreenOnly, .excludeDesktopElements)
if let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] {
  for w in list {
    let owner = w[kCGWindowOwnerName as String] as? String ?? ""
    let name  = w[kCGWindowName as String] as? String ?? ""
    let num   = w[kCGWindowNumber as String] as? Int ?? 0
    if owner.contains("Chrome") && !name.isEmpty { print("\(num)\t\(name)") }
  }
}
