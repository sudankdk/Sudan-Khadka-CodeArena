package executer

import (
	"context"
	"errors"
	"log"
	"path/filepath"

	"github.com/sudankdk/ceev2/internal/docker"
	"github.com/sudankdk/ceev2/internal/languages"
	"github.com/sudankdk/ceev2/internal/sandbox"
	"github.com/sudankdk/ceev2/internal/utils"
)

type Request struct {
	Language string `json:"language"`
	Code     string `json:"code"`
	Stdin    string `json:"stdin"`
	Timeout  int    `json:"timeout"` // seconds
}

type Response struct {
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	ExitCode int    `json:"exit_code"`
}

type Executor struct {
	docker  *docker.Client
	pooling *docker.PoolManager
	langs   languages.LanguageMap
}

func NewExecutor(d *docker.Client, lang languages.LanguageMap, p *docker.PoolManager) *Executor {
	return &Executor{docker: d, langs: lang, pooling: p}
}

func (e *Executor) Run(ctx context.Context, req Request) (*Response, error) {
	log.Printf("[EXECUTOR] Starting Run with timeout=%d seconds, language=%s", req.Timeout, req.Language)

	langCfg, ok := e.langs[req.Language]
	if !ok {
		return nil, errors.New("unsupported language")
	}
	log.Printf("[EXECUTOR] Language config: %+v", langCfg)

	pc, err := e.pooling.Acquire(ctx, langCfg.Image)
	if err != nil {
		log.Printf("[EXECUTOR] Failed to acquire container: %v", err)
		return nil, err
	}
	log.Printf("[EXECUTOR] Container acquired: %s", pc.ID[:12])
	defer e.pooling.Release(pc)

	files, err := utils.Save(req.Code, req.Stdin, langCfg.Ext)
	if err != nil {
		log.Printf("[EXECUTOR] Failed to save files: %v", err)
		return nil, err
	}
	log.Printf("[EXECUTOR] Files saved to: %s", files.Dir)
	defer utils.CleanupFiles(files.Dir)

	codeFileName := "/run/code/" + filepath.Base(files.CodePath)
	stdInFileName := "/run/code/" + filepath.Base(files.StdinPath)

	sb := sandbox.NewConfig(files.Dir, codeFileName, stdInFileName, req.Language, req.Timeout)
	log.Printf("[EXECUTOR] Sandbox config created with timeout: %v", sb.Timeout)

	if err := e.docker.CopyFilesToContainer(ctx, pc.ID, files.Dir); err != nil {
		log.Printf("[EXECUTOR] Failed to copy files: %v", err)
		return nil, err
	}
	log.Printf("[EXECUTOR] Files copied to container")

	log.Printf("[EXECUTOR] Executing code in container")
	res, err := e.docker.ExecInExistingContainer(ctx, pc.ID, sb)
	if err != nil {
		log.Printf("[EXECUTOR] Execution failed: %v", err)
		return nil, err
	}
	log.Printf("[EXECUTOR] Execution completed successfully")

	return &Response{
		Stdout:   res.Stdout,
		Stderr:   res.Stderr,
		ExitCode: res.ExitCode,
	}, nil
}
