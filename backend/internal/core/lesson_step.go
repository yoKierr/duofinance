package core

import (
	"errors"

	"github.com/ImCtyz/duofinance/backend/internal/domain"
)

// ErrNoMoreLessonSteps is returned when all steps in the level have been completed for this attempt.
var ErrNoMoreLessonSteps = errors.New("no more lesson steps")

const (
	LessonStepKindNone     = "none"
	LessonStepKindText    = "text"
	LessonStepKindQuestion = "question"
)

// NextLessonStep is the next UI block for an in-progress attempt (informational card or quiz question).
type NextLessonStep struct {
	Kind        string
	LevelStepID uint
	Title       string
	Body        string
	Question    *domain.Question
}
