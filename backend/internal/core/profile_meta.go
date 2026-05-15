package core

import (
	"encoding/json"
	"errors"
	"strings"
	"unicode"

	"gorm.io/datatypes"
)

var (
	ErrInvalidUsername = errors.New("invalid username")
	ErrUsernameTaken   = errors.New("username already taken")
	ErrAvatarTooLarge  = errors.New("avatar too large")
	ErrInvalidAvatar   = errors.New("invalid avatar format")
)

const maxAvatarDataLen = 600_000

// ProfileAvatarFromMeta извлекает data URL аватара из meta профиля.
func ProfileAvatarFromMeta(meta datatypes.JSON) string {
	if meta == nil || len(meta) == 0 {
		return ""
	}
	var m map[string]interface{}
	if err := json.Unmarshal(meta, &m); err != nil {
		return ""
	}
	if v, ok := m["avatar"].(string); ok {
		return v
	}
	return ""
}

func mergeProfileMeta(meta datatypes.JSON, patch map[string]interface{}) (datatypes.JSON, error) {
	var m map[string]interface{}
	if meta != nil && len(meta) > 0 {
		_ = json.Unmarshal(meta, &m)
	}
	if m == nil {
		m = make(map[string]interface{})
	}
	for k, v := range patch {
		if v == nil {
			delete(m, k)
		} else {
			m[k] = v
		}
	}
	b, err := json.Marshal(m)
	if err != nil {
		return nil, err
	}
	return datatypes.JSON(b), nil
}

func validateUsername(username string) error {
	runes := []rune(strings.TrimSpace(username))
	if len(runes) < 3 || len(runes) > 50 {
		return ErrInvalidUsername
	}
	for _, r := range runes {
		if !(unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_') {
			return ErrInvalidUsername
		}
	}
	return nil
}

func validateAvatarDataURL(avatar string) error {
	if avatar == "" {
		return nil
	}
	if len(avatar) > maxAvatarDataLen {
		return ErrAvatarTooLarge
	}
	if !strings.HasPrefix(avatar, "data:image/jpeg") &&
		!strings.HasPrefix(avatar, "data:image/png") &&
		!strings.HasPrefix(avatar, "data:image/webp") &&
		!strings.HasPrefix(avatar, "data:image/gif") {
		return ErrInvalidAvatar
	}
	return nil
}
