package ws

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/logger"
	"go.uber.org/zap"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 65536
)

// Client represents a single WebSocket connection.
type Client struct {
	ID      string
	UserID  uuid.UUID
	MatchID string // empty if not in a match
	Conn    *websocket.Conn
	Send    chan []byte
	Hub     *Hub
	mu      sync.Mutex
}

// ReadPump reads messages from the WebSocket connection and dispatches them.
func (c *Client) ReadPump(handler *WSHandler) {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(maxMessageSize)
	c.Conn.SetReadDeadline(time.Now().Add(pongWait))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseNoStatusReceived) {
				logger.Info("WebSocket closed", zap.Error(err), zap.String("user_id", c.UserID.String()))
			} else if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				logger.Error("WebSocket read error", zap.Error(err), zap.String("user_id", c.UserID.String()))
			}
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			logger.Warn("Invalid WebSocket message", zap.Error(err))
			c.SendError("Invalid message format")
			continue
		}

		handler.HandleMessage(c, msg)
	}
}

// WritePump writes messages from the send channel to the WebSocket connection.
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				logger.Error("WebSocket write error", zap.Error(err))
				return
			}
		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// SendJSON sends a typed message to the client.
func (c *Client) SendJSON(msgType string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		logger.Error("Failed to marshal payload", zap.Error(err))
		return
	}

	msg := WSMessage{
		Type:    msgType,
		Payload: data,
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		logger.Error("Failed to marshal message", zap.Error(err))
		return
	}

	select {
	case c.Send <- msgBytes:
	default:
		logger.Warn("Client send buffer full, dropping message", zap.String("user_id", c.UserID.String()))
	}
}

// SendError sends an error message to the client.
func (c *Client) SendError(message string) {
	c.SendJSON(MsgError, ErrorPayload{Message: message})
}

// SetMatchID safely sets the match ID for the client.
func (c *Client) SetMatchID(matchID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.MatchID = matchID
}

// GetMatchID safely gets the match ID for the client.
func (c *Client) GetMatchID() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.MatchID
}
