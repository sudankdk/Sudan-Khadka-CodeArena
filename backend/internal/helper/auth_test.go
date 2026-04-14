package helper

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/sudankdk/codearena/internal/domain"
)

// testAuth returns a fresh Auth helper with a fixed test secret.
func testAuth() Auth {
	return Auth{Secret: "unit-test-secret-key-goes-here"}
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateHash / VerifyHash
// ─────────────────────────────────────────────────────────────────────────────

func TestCreateHash_ReturnsNonEmptyHash(t *testing.T) {
	a := testAuth()

	hash, err := a.CreateHash("mypassword")

	require.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, "mypassword", hash, "stored hash must not equal the plain-text password")
}

func TestCreateHash_IsNonDeterministic(t *testing.T) {
	// bcrypt generates a new salt each time, so two hashes of the same input must differ.
	a := testAuth()
	h1, _ := a.CreateHash("samepassword")
	h2, _ := a.CreateHash("samepassword")

	assert.NotEqual(t, h1, h2, "each bcrypt hash must use a unique salt")
}

func TestVerifyHash_CorrectPassword_ReturnsTrue(t *testing.T) {
	a := testAuth()
	hash, err := a.CreateHash("correctpass")
	require.NoError(t, err)

	ok := a.VerifyHash("correctpass", hash)

	assert.True(t, ok)
}

func TestVerifyHash_WrongPassword_ReturnsFalse(t *testing.T) {
	a := testAuth()
	hash, _ := a.CreateHash("correctpass")

	ok := a.VerifyHash("wrongpass", hash)

	assert.False(t, ok)
}

func TestVerifyHash_EmptyPassword_ReturnsFalse(t *testing.T) {
	a := testAuth()
	hash, _ := a.CreateHash("somepassword")

	ok := a.VerifyHash("", hash)

	assert.False(t, ok)
}

// ─────────────────────────────────────────────────────────────────────────────
// GenerateToken
// ─────────────────────────────────────────────────────────────────────────────

func TestGenerateToken_Success_ReturnsNonEmptyToken(t *testing.T) {
	a := testAuth()
	id := uuid.New()

	token, err := a.GenerateToken(id, "alice@example.com", domain.REGULAR)

	require.NoError(t, err)
	assert.NotEmpty(t, token)
	// JWT tokens consist of three base64url-encoded parts separated by dots.
	assert.Equal(t, 3, len(strings.Split(token, ".")), "token should have 3 JWT segments")
}

func TestGenerateToken_NilUUID_ReturnsError(t *testing.T) {
	a := testAuth()

	_, err := a.GenerateToken(uuid.Nil, "admin@example.com", domain.ADMIN)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "required fields cannot be empty")
}

func TestGenerateToken_EmptyEmail_ReturnsError(t *testing.T) {
	a := testAuth()

	_, err := a.GenerateToken(uuid.New(), "", domain.REGULAR)

	require.Error(t, err)
}

func TestGenerateToken_EmptyRole_ReturnsError(t *testing.T) {
	a := testAuth()

	_, err := a.GenerateToken(uuid.New(), "user@example.com", "")

	require.Error(t, err)
}

// ─────────────────────────────────────────────────────────────────────────────
// VerifyToken
// ─────────────────────────────────────────────────────────────────────────────

func TestVerifyToken_ValidBearerToken_ReturnsUser(t *testing.T) {
	a := testAuth()
	id := uuid.New()
	signed, _ := a.GenerateToken(id, "carol@example.com", domain.ADMIN)

	user, err := a.VerifyToken("Bearer " + signed)

	require.NoError(t, err)
	assert.Equal(t, "carol@example.com", user.Email)
	assert.Equal(t, domain.ADMIN, user.Role)
	assert.Equal(t, id, user.ID)
}

func TestVerifyToken_BareBearerToken_AcceptsWithoutPrefix(t *testing.T) {
	// The implementation normalises a bare token to "Bearer <token>".
	a := testAuth()
	signed, _ := a.GenerateToken(uuid.New(), "dave@example.com", domain.REGULAR)

	user, err := a.VerifyToken(signed)

	require.NoError(t, err)
	assert.Equal(t, "dave@example.com", user.Email)
}

func TestVerifyToken_MissingToken_ReturnsError(t *testing.T) {
	a := testAuth()

	_, err := a.VerifyToken("")

	require.Error(t, err)
}

func TestVerifyToken_InvalidSignature_ReturnsError(t *testing.T) {
	a := testAuth()
	// Sign with a different secret; our Auth should reject it.
	other := Auth{Secret: "totally-different-secret"}
	signed, _ := other.GenerateToken(uuid.New(), "eve@example.com", domain.REGULAR)

	_, err := a.VerifyToken("Bearer " + signed)

	require.Error(t, err)
}

func TestVerifyToken_TamperedToken_ReturnsError(t *testing.T) {
	a := testAuth()
	signed, _ := a.GenerateToken(uuid.New(), "frank@example.com", domain.REGULAR)

	// Tamper with the signature segment.
	parts := strings.Split(signed, ".")
	parts[2] = parts[2] + "tampered"
	tampered := strings.Join(parts, ".")

	_, err := a.VerifyToken("Bearer " + tampered)

	require.Error(t, err)
}

func TestVerifyToken_ExpiredToken_ReturnsError(t *testing.T) {
	a := testAuth()

	// Manually craft a token that expired in the past.
	pastExpiry := time.Now().Add(-24 * time.Hour).Unix()
	claims := jwt.MapClaims{
		"id":          uuid.New().String(),
		"email":       "ghost@example.com",
		"role":        domain.REGULAR,
		"expiry_date": pastExpiry,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(a.Secret))
	require.NoError(t, err)

	_, verifyErr := a.VerifyToken("Bearer " + signed)

	require.Error(t, verifyErr, "expired token must be rejected")
	assert.Contains(t, verifyErr.Error(), "expired")
}

func TestVerifyToken_WrongPrefixFormat_ReturnsError(t *testing.T) {
	a := testAuth()
	signed, _ := a.GenerateToken(uuid.New(), "user@x.com", domain.REGULAR)

	// "Token <jwt>" is not accepted – only "Bearer <jwt>" or bare token.
	_, err := a.VerifyToken("Token " + signed)

	require.Error(t, err)
}

// ─────────────────────────────────────────────────────────────────────────────
// Round-trip test: GenerateToken → VerifyToken preserves all claims
// ─────────────────────────────────────────────────────────────────────────────

func TestGenerateToken_VerifyToken_RoundTrip(t *testing.T) {
	a := testAuth()
	originalID := uuid.New()
	originalEmail := "roundtrip@example.com"
	originalRole := domain.ADMIN

	token, err := a.GenerateToken(originalID, originalEmail, originalRole)
	require.NoError(t, err)

	user, err := a.VerifyToken("Bearer " + token)
	require.NoError(t, err)

	assert.Equal(t, originalID, user.ID)
	assert.Equal(t, originalEmail, user.Email)
	assert.Equal(t, originalRole, user.Role)
}
