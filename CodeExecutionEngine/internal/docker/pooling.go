package docker

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/sudankdk/ceev2/internal/languages"
)

type PoolManager struct {
	client *Client
	pool   map[string]*PoolContainer
	mu     sync.Mutex
}

type PoolContainer struct {
	ID       string
	Status   string
	LastUsed time.Time
	Image    string
}

func NewPoolManager(c *Client) *PoolManager {
	return &PoolManager{
		client: c,
		pool:   make(map[string]*PoolContainer),
	}
}

func (pm *PoolManager) createPoolContainer(ctx context.Context, image string) (string, error) {

	resp, err := pm.client.d.ContainerCreate(
		ctx,
		&container.Config{
			Image: image,
			Cmd:   []string{"tail", "-f", "/dev/null"},
			Labels: map[string]string{
				"pool":       "true",
				"pool.image": image,
			},
			Entrypoint: []string{},
		},
		&container.HostConfig{
			AutoRemove:  false,
			NetworkMode: "none",
		},
		nil, nil, "",
	)
	if err != nil {
		return "", err
	}

	if err := pm.client.d.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", err
	}

	return resp.ID, nil
}

func (pm *PoolManager) PreWarm(ctx context.Context, langs languages.LanguageMap) error {

	for _, lang := range langs {
		totalContainers := 1

		containers, err := pm.ListContainers(ctx, lang)
		if err != nil {
			return err
		}

		if len(containers) == totalContainers {
			continue
		}

		containersToCreate := totalContainers - len(containers)
		for i := 0; i < containersToCreate; i++ {
			id, err := pm.createPoolContainer(ctx, lang.Image)
			if err != nil {
				return err
			}

			pm.mu.Lock()
			pm.pool[id] = &PoolContainer{
				ID:       id,
				Status:   "idle",
				LastUsed: time.Now(),
				Image:    lang.Image,
			}
			pm.mu.Unlock()
		}
	}

	return nil
}

func (pm *PoolManager) Acquire(ctx context.Context, image string) (*PoolContainer, error) {
	log.Printf("[POOL] Acquiring container for image: %s", image)
	pm.mu.Lock()

	for _, cont := range pm.pool {
		if cont.Status == "idle" && cont.Image == image {
			log.Printf("[POOL] Found idle container: %s", cont.ID[:12])
			cont.Status = "busy"
			pm.mu.Unlock()
			return cont, nil
		}
	}
	log.Printf("[POOL] No idle container found, creating new one")
	pm.mu.Unlock()

	// No idle container found, create a new one
	id, err := pm.createPoolContainer(ctx, image)
	if err != nil {
		log.Printf("[POOL] Failed to create container: %v", err)
		return nil, err
	}
	log.Printf("[POOL] New container created: %s", id[:12])

	newCont := &PoolContainer{
		ID:       id,
		Status:   "busy",
		LastUsed: time.Now(),
		Image:    image,
	}

	pm.mu.Lock()
	pm.pool[id] = newCont
	pm.mu.Unlock()

	log.Printf("[POOL] Container added to pool and marked busy: %s", id[:12])
	return newCont, nil
}

func (pm *PoolManager) Release(cont *PoolContainer) {
	if cont == nil {
		log.Printf("[POOL] Release called with nil container")
		return
	}
	log.Printf("[POOL] Releasing container: %s", cont.ID[:12])
	pm.mu.Lock()
	cont.Status = "idle"
	cont.LastUsed = time.Now()
	pm.mu.Unlock()
	log.Printf("[POOL] Container marked as idle: %s", cont.ID[:12])
}

func (pm *PoolManager) ListContainers(ctx context.Context, lang languages.Language) ([]*PoolContainer, error) {
	args := filters.NewArgs()
	args.Add("label", "pool=true")
	args.Add("label", fmt.Sprintf("pool.image=%s", lang.Image))

	containers, err := pm.client.d.ContainerList(ctx, container.ListOptions{
		Filters: args,
	})
	if err != nil {
		return nil, err
	}

	var poolContainers []*PoolContainer
	pm.mu.Lock()
	defer pm.mu.Unlock()

	for _, c := range containers {
		if _, exists := pm.pool[c.ID]; !exists {
			status := "idle"
			if c.State != "running" {
				status = "stopped"
			}
			pm.pool[c.ID] = &PoolContainer{
				ID:       c.ID,
				Status:   status,
				LastUsed: time.Now(),
				Image:    c.Image,
			}
		}
		poolContainers = append(poolContainers, pm.pool[c.ID])
	}

	return poolContainers, nil
}
