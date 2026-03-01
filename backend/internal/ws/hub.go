package ws

import (
	"sync"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/logger"
	"go.uber.org/zap"
)

// Hub maintains the set of active clients and broadcasts messages to rooms.
type Hub struct {
	// Registered clients mapped by user ID.
	Clients map[uuid.UUID]*Client

	// Match rooms: matchID -> set of clients in that room.
	Rooms map[string]map[uuid.UUID]*Client

	// Spectators: matchID -> set of spectator clients.
	Spectators map[string]map[uuid.UUID]*Client

	Register   chan *Client
	Unregister chan *Client

	mu sync.RWMutex

	// onDisconnect is called when a client in an active match disconnects.
	OnDisconnect func(client *Client)
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[uuid.UUID]*Client),
		Rooms:      make(map[string]map[uuid.UUID]*Client),
		Spectators: make(map[string]map[uuid.UUID]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

// Run starts the hub's main event loop. Must be called as a goroutine.
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client.UserID] = client
			h.mu.Unlock()
			logger.Info("Client registered", zap.String("user_id", client.UserID.String()))

		case client := <-h.Unregister:
			h.mu.Lock()
			existing := h.Clients[client.UserID]

			// Only remove from Clients map if this is the SAME client instance.
			// A newer connection may have already replaced it (e.g. page navigation).
			if existing == client {
				delete(h.Clients, client.UserID)
			}

			// Always close the disconnecting client's send channel
			close(client.Send)

			// Remove this specific client from its room (check identity to
			// avoid removing a newer connection that joined the same room).
			matchID := client.GetMatchID()
			if matchID != "" {
				if room, ok := h.Rooms[matchID]; ok {
					if room[client.UserID] == client {
						delete(room, client.UserID)
						if len(room) == 0 {
							delete(h.Rooms, matchID)
						}
					}
				}
				// Trigger disconnect handler if set
				if h.OnDisconnect != nil {
					go h.OnDisconnect(client)
				}
			}

			// Remove from spectator rooms
			for roomID, spectators := range h.Spectators {
				if spectators[client.UserID] == client {
					delete(spectators, client.UserID)
					if len(spectators) == 0 {
						delete(h.Spectators, roomID)
					}
				}
			}
			h.mu.Unlock()
			logger.Info("Client unregistered", zap.String("user_id", client.UserID.String()))
		}
	}
}

// JoinRoom adds a client to a match room.
func (h *Hub) JoinRoom(matchID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.Rooms[matchID]; !ok {
		h.Rooms[matchID] = make(map[uuid.UUID]*Client)
	}
	h.Rooms[matchID][client.UserID] = client
	client.SetMatchID(matchID)

	logger.Info("Client joined room",
		zap.String("user_id", client.UserID.String()),
		zap.String("match_id", matchID),
	)
}

// LeaveRoom removes a client from a match room.
func (h *Hub) LeaveRoom(matchID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, ok := h.Rooms[matchID]; ok {
		delete(room, client.UserID)
		if len(room) == 0 {
			delete(h.Rooms, matchID)
		}
	}
	client.SetMatchID("")
}

// JoinSpectator adds a client as a spectator to a match.
func (h *Hub) JoinSpectator(matchID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.Spectators[matchID]; !ok {
		h.Spectators[matchID] = make(map[uuid.UUID]*Client)
	}
	h.Spectators[matchID][client.UserID] = client
}

// BroadcastToRoom sends a message to all clients in a match room.
func (h *Hub) BroadcastToRoom(matchID string, msgType string, payload interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if room, ok := h.Rooms[matchID]; ok {
		for _, client := range room {
			client.SendJSON(msgType, payload)
		}
	}

	// Also send to spectators
	if spectators, ok := h.Spectators[matchID]; ok {
		for _, client := range spectators {
			client.SendJSON(msgType, payload)
		}
	}
}

// SendToUser sends a message to a specific user.
func (h *Hub) SendToUser(userID uuid.UUID, msgType string, payload interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if client, ok := h.Clients[userID]; ok {
		client.SendJSON(msgType, payload)
	}
}

// SendToOpponent sends a message to the opponent of a user in a match room.
func (h *Hub) SendToOpponent(matchID string, senderID uuid.UUID, msgType string, payload interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if room, ok := h.Rooms[matchID]; ok {
		for uid, client := range room {
			if uid != senderID {
				client.SendJSON(msgType, payload)
			}
		}
	}
}

// GetClient returns a client by user ID, or nil if not connected.
func (h *Hub) GetClient(userID uuid.UUID) *Client {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.Clients[userID]
}

// IsUserConnected checks if a user is currently connected.
func (h *Hub) IsUserConnected(userID uuid.UUID) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.Clients[userID]
	return ok
}

// GetRoomSize returns the number of clients in a room.
func (h *Hub) GetRoomSize(matchID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if room, ok := h.Rooms[matchID]; ok {
		return len(room)
	}
	return 0
}
