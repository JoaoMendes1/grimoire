package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

var jwks *keyfunc.JWKS

// InitJWKS é chamado no main.go para baixar as chaves assimétricas do Supabase
func InitJWKS() error {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_URL não definida")
	}

	jwksURL := supabaseURL + "/auth/v1/.well-known/jwks.json"

	options := keyfunc.Options{
		RefreshInterval: time.Hour,
		RefreshTimeout:  time.Second * 10,
	}

	var err error
	jwks, err = keyfunc.Get(jwksURL, options)
	if err != nil {
		return fmt.Errorf("falha ao baixar JWKS do Supabase: %w", err)
	}

	fmt.Println("✅ JWKS do Supabase carregado e armazenado em cache (Asymmetric Keys).")
	return nil
}

func AuthSupabase(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		if jwks == nil {
			fmt.Println("⛔ ERRO: JWKS não inicializado no servidor.")
			http.Error(w, "Erro interno", http.StatusInternalServerError)
			return
		}

		// A mágica acontece aqui: validação ultrarrápida na memória usando a chave pública (ES256/RS256)
		token, err := jwt.Parse(tokenString, jwks.Keyfunc)

		if err != nil || !token.Valid {
			fmt.Println("⛔ RECUSADO: Token JWT inválido ou expirado:", err)
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			fmt.Println("⛔ RECUSADO: Falha ao extrair claims do token.")
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			fmt.Println("⛔ RECUSADO: Falha ao ler ID (sub) do usuário.")
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}