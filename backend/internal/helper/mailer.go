package helper

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net/smtp"
	"strings"
)

type Mailer interface {
	Send(to, subject, body string) error
}

type SMTPMailer struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
	UseTLS   bool
}

func (m *SMTPMailer) Send(to, subject, body string) error {
	if m.Host == "" || m.Port == 0 || m.From == "" {
		return errors.New("smtp not configured")
	}

	addr := fmt.Sprintf("%s:%d", m.Host, m.Port)

	fromHeader := m.From
	if strings.TrimSpace(m.FromName) != "" {
		fromHeader = fmt.Sprintf("%s <%s>", strings.TrimSpace(m.FromName), m.From)
	}

	msg := strings.Builder{}
	msg.WriteString("From: " + fromHeader + "\r\n")
	msg.WriteString("To: " + to + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)

	if m.UseTLS {
		return m.sendWithTLS(addr, to, msg.String())
	}

	client, err := smtp.Dial(addr)
	if err != nil {
		return err
	}
	defer client.Quit()

	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{ServerName: m.Host}
		if err := client.StartTLS(tlsConfig); err != nil {
			return err
		}
	}

	if m.Username != "" || m.Password != "" {
		auth := smtp.PlainAuth("", m.Username, m.Password, m.Host)
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(m.From); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}

	w, err := client.Data()
	if err != nil {
		return err
	}
	defer w.Close()

	if _, err := w.Write([]byte(msg.String())); err != nil {
		return err
	}

	return nil
}

func (m *SMTPMailer) sendWithTLS(addr, to, msg string) error {
	tlsConfig := &tls.Config{ServerName: m.Host}
	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, m.Host)
	if err != nil {
		return err
	}
	defer client.Quit()

	if m.Username != "" || m.Password != "" {
		auth := smtp.PlainAuth("", m.Username, m.Password, m.Host)
		if err := client.Auth(auth); err != nil {
			return err
		}
	}

	if err := client.Mail(m.From); err != nil {
		return err
	}
	if err := client.Rcpt(to); err != nil {
		return err
	}

	w, err := client.Data()
	if err != nil {
		return err
	}
	defer w.Close()

	if _, err := w.Write([]byte(msg)); err != nil {
		return err
	}

	return nil
}
