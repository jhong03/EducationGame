/**
 * Cheap one-shot WebGL capability probe. The 3D garden only mounts when this
 * is true; otherwise GardenScreen shows a 2D fallback plot. This is also what
 * keeps the jsdom test environment (no WebGL) off the three.js path, so the
 * heavy 3D module is never even imported there.
 */
export function hasWebGL(): boolean {
  try {
    if (typeof document === 'undefined') return false
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}
