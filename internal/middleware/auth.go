package middleware 

import (
	"net/http"
	"os"
)

func AuthPIN(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		pinSalvo := os.Getenv("APP_PIN")
		pinRecebido := r.Header.Get("X-App-PIN")


		// Bloqueio rigoroso: se as senhas não forem idênticas, barra na hora
		if pinRecebido != pinSalvo {
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}