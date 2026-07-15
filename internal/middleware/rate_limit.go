package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

var (
	// Mapa para guardar os IPs e seus respectivos limitadores 
	clients = make(map[string]*rate.Limiter)
	mu      sync.Mutex 
)

// getLimiter busca o limitador de um IP específico ou cria um novo 
func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limiter, exists := clients[ip]
	if !exists {
		// Regra: 2 requisições por segundo, com capacidade para picos de até 5 simultâneas.
		// Essa proporção é ideal para evitar abusos de APIs externas (tradução/IA).
		limiter = rate.NewLimiter(rate.Every(time.Second/2), 20)
		clients[ip] = limiter
	}

	return limiter
}

// RateLimitAPI é o escudo que vai na frente das nossas rotas sensíveis
func RateLimitAPI(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Pega o IP original do usuário 
		ip := r.RemoteAddr

		// Como vamos rodar no Render (que usa Proxy), precisamos pegar o IP real do header
		forwarded := r.Header.Get("X-Forwarted-For")
		if forwarded != "" {
			// O X-Forwarded-For pode conter uma lista de IPs, pegamos o primeiro
			ips := strings.Split(forwarded, ",")
			ip = strings.TrimSpace(ips[0])
		} else {
			// Limpa a porta do RemoteAddr caso seja localhost (ex: 127.0.0.1:54321 -> 127.0.0.1)
			ip = strings.Split(ip, ":")[0]
		}

		limiter := getLimiter(ip)

		// Se o usuário estourar o limite, ele toma um bloqueio instantâneo
		if !limiter.Allow() {
			http.Error(w, `{"error": "Muitas requisições. Tente novamente em alguns instantes."}`, http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}