package domain

type AttemptStatus string

const (
	AttemptInProgress AttemptStatus = "in_progress"
	AttemptCompleted  AttemptStatus = "completed"
	AttemptFailed     AttemptStatus = "failed"
)
