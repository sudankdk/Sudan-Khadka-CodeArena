package sandbox

import (
	"fmt"
	"log"
	"time"
)

type Config struct {
	ExecCmd        []string
	Stdin          string
	Memory         int64 // bytes
	CPU            int64 // NanoCPUs
	Binds          []string
	ReadonlyRootfs bool
	Timeout        time.Duration
}

func NewConfig(codeDir, codeFilename, stdinFilename, lang string, timeoutSeconds int) Config {
	var cmd []string
	readonly := true
	if timeoutSeconds <= 0 {
		timeoutSeconds = 20
	}

	log.Printf("[SANDBOX] Creating config for language=%s, timeoutSeconds=%d", lang, timeoutSeconds)

	switch lang {
	case "python":
		cmd = []string{"python3", codeFilename}
	case "go":
		cmd = []string{"go", "run", codeFilename}
		readonly = false
	case "node":
		cmd = []string{"node", codeFilename}
	}

	duration := time.Duration(timeoutSeconds) * time.Second
	log.Printf("[SANDBOX] Final timeout duration: %v", duration)

	// Enforce execution timeout within the container to avoid runaway processes
	timeoutCmd := []string{"timeout", "-s", "KILL", fmt.Sprintf("%d", timeoutSeconds)}
	cmd = append(timeoutCmd, cmd...)

	return Config{
		ExecCmd:        cmd,
		Memory:         512 * 1024 * 1024,
		CPU:            1_000_000_000,
		Binds:          []string{codeDir + ":/run/code"},
		ReadonlyRootfs: readonly,
		Timeout:        duration,
	}
}
