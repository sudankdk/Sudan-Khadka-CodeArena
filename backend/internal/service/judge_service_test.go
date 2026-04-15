package service

import (
	"image"
	"image/color"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ─────────────────────────────────────────────────────────────────────────────
// buildDocument (unexported – accessible from same package)
// ─────────────────────────────────────────────────────────────────────────────

func TestBuildDocument_ContainsAllSections(t *testing.T) {
	html := "<h1>Hello</h1>"
	css := "body{margin:0}"
	js := "console.log('hi')"

	doc := buildDocument(html, css, js)

	assert.Contains(t, doc, "<!DOCTYPE html>")
	assert.Contains(t, doc, "<html>")
	assert.Contains(t, doc, "<style>"+css+"</style>")
	assert.Contains(t, doc, html)
	assert.Contains(t, doc, "<script>"+js+"</script>")
}

func TestBuildDocument_EmptyParts_StillValidHTML(t *testing.T) {
	doc := buildDocument("", "", "")

	assert.Contains(t, doc, "<!DOCTYPE html>")
	assert.Contains(t, doc, "<html>")
	assert.Contains(t, doc, "<body>")
}

func TestBuildDocument_OrderIsCorrect(t *testing.T) {
	// CSS should appear before body HTML, which should appear before JS.
	doc := buildDocument("<p>body</p>", "p{color:red}", "alert(1)")

	cssIdx := indexOf(doc, "<style>")
	bodyIdx := indexOf(doc, "<p>body</p>")
	jsIdx := indexOf(doc, "<script>")

	assert.Less(t, cssIdx, bodyIdx, "CSS must come before body HTML")
	assert.Less(t, bodyIdx, jsIdx, "body HTML must come before JS")
}

// indexOf returns the byte index of substr in s, or -1 if not found.
func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// ─────────────────────────────────────────────────────────────────────────────
// colorDistance (unexported)
// ─────────────────────────────────────────────────────────────────────────────

func TestColorDistance_IdenticalColors_ReturnsZero(t *testing.T) {
	c := color.RGBA{R: 128, G: 64, B: 200, A: 255}
	dist := colorDistance(c, c)
	assert.Equal(t, 0.0, dist)
}

func TestColorDistance_BlackAndWhite_LargeDistance(t *testing.T) {
	black := color.RGBA{R: 0, G: 0, B: 0, A: 255}
	white := color.RGBA{R: 255, G: 255, B: 255, A: 255}
	dist := colorDistance(black, white)
	assert.Greater(t, dist, 100.0, "black and white should have a large colour distance")
}

func TestColorDistance_IsCommutative(t *testing.T) {
	c1 := color.RGBA{R: 100, G: 150, B: 200, A: 255}
	c2 := color.RGBA{R: 50, G: 80, B: 100, A: 200}

	d1 := colorDistance(c1, c2)
	d2 := colorDistance(c2, c1)

	assert.InDelta(t, d1, d2, 1e-9, "colour distance must be commutative")
}

func TestColorDistance_AlphaContributesToDistance(t *testing.T) {
	opaque := color.RGBA{R: 0, G: 0, B: 0, A: 255}
	transparent := color.RGBA{R: 0, G: 0, B: 0, A: 0}

	dist := colorDistance(opaque, transparent)

	assert.Greater(t, dist, 0.0, "differing alpha channels should produce non-zero distance")
}

// ─────────────────────────────────────────────────────────────────────────────
// compareScreenshots (unexported)
// ─────────────────────────────────────────────────────────────────────────────

// makeImage creates a solid-colour RGBA image of the given dimensions.
func makeImage(w, h int, c color.RGBA) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			img.SetRGBA(x, y, c)
		}
	}
	return img
}

// The following tests cover various scenarios for compareScreenshots, including:
// - Identical images → should yield zero diff ratio
// - Completely different colours → should yield a high diff ratio
// - Zero-dimension images → should return an error and ratio=1.0
// - Different sizes → should account for size difference in ratio
// - High pixel threshold → should ignore small differences and show zero diff for identical images
func TestCompareScreenshots_IdenticalImages_DiffRatioIsZero(t *testing.T) {
	img := makeImage(10, 10, color.RGBA{R: 255, G: 0, B: 0, A: 255})

	ratio, err := compareScreenshots(img, img, 0.1)

	require.NoError(t, err)
	assert.Equal(t, 0.0, ratio, "identical images should have zero diff ratio")
}

func TestCompareScreenshots_CompletelyDifferentColors_HighDiffRatio(t *testing.T) {
	red := makeImage(10, 10, color.RGBA{R: 255, G: 0, B: 0, A: 255})
	blue := makeImage(10, 10, color.RGBA{R: 0, G: 0, B: 255, A: 255})

	ratio, err := compareScreenshots(red, blue, 0.0) // threshold=0 → any diff counts

	require.NoError(t, err)
	assert.Greater(t, ratio, 0.0, "completely different colour images should have a high diff ratio")
}

func TestCompareScreenshots_ZeroDimensionImage_ReturnsError(t *testing.T) {
	// An image with zero width/height should trigger the guard clause.
	zero := image.NewRGBA(image.Rect(0, 0, 0, 0))
	ref := makeImage(10, 10, color.RGBA{R: 100, G: 100, B: 100, A: 255})

	ratio, err := compareScreenshots(zero, ref, 0.1)

	require.Error(t, err)
	assert.Equal(t, 1.0, ratio, "zero-dimension comparison should return ratio=1.0")
}

func TestCompareScreenshots_DifferentSizes_AccountsForSizeDiff(t *testing.T) {
	small := makeImage(5, 5, color.RGBA{R: 255, G: 255, B: 255, A: 255})
	large := makeImage(10, 10, color.RGBA{R: 255, G: 255, B: 255, A: 255})

	ratio, err := compareScreenshots(small, large, 0.0)

	require.NoError(t, err)
	// The size difference adds un-comparable pixels.
	// Small is 25 px, large is 100 px → 75 extra pixels counted as diff.
	// diff = 75 / 100 = 0.75
	assert.InDelta(t, 0.75, ratio, 0.01)
}

func TestCompareScreenshots_SameImageHighThreshold_ZeroDiff(t *testing.T) {
	// With a high pixel threshold, very similar images should show no diff.
	img := makeImage(4, 4, color.RGBA{R: 128, G: 128, B: 128, A: 255})

	ratio, err := compareScreenshots(img, img, 1.0) // maxColorDist = 1.0 × 255 = 255

	require.NoError(t, err)
	assert.Equal(t, 0.0, ratio)
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveReferencePath (unexported)
// ─────────────────────────────────────────────────────────────────────────────

// TestResolveReferencePath_EmptyPath_ReturnsError tests that resolveReferencePath returns an error when given an empty path.
func TestResolveReferencePath_EmptyPath_ReturnsError(t *testing.T) {
	js := &JudgeService{outputDir: "screenshots"}

	_, err := js.resolveReferencePath("")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "empty")
}

func TestResolveReferencePath_AbsolutePath_ReturnedUnchanged(t *testing.T) {
	js := &JudgeService{outputDir: "screenshots"}

	// Use os.TempDir() so the path is genuinely absolute on every OS
	// (e.g. "C:\Users\...\AppData\Local\Temp" on Windows, "/tmp" on Linux).
	absPath := filepath.Join(os.TempDir(), "ref_image.png")
	result, err := js.resolveReferencePath(absPath)

	require.NoError(t, err)
	assert.Equal(t, absPath, result)
}

func TestResolveReferencePath_RelativePath_JoinedWithOutputDir(t *testing.T) {
	js := &JudgeService{outputDir: "/screenshots"}

	result, err := js.resolveReferencePath("ref_abc.png")

	require.NoError(t, err)
	assert.Contains(t, result, "ref_abc.png")
}
