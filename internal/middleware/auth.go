package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
	"net/url"

	"github.com/MicahParks/keyfunc/v2"
	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const UserIDKey contextKey = "userID"

var jwks *keyfunc.JWKS

// authTransport injeta as credenciais em todas as chamadas feitas para o Supabase
type authTransport struct {
	http.RoundTripper
	apiKey string
}

func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("apikey", t.apiKey)
	req.Header.Set("Authorization", "Bearer "+t.apiKey)
	
	if t.RoundTripper == nil {
		return http.DefaultTransport.RoundTrip(req)
	}
	return t.RoundTripper.RoundTrip(req)
}

// InitJWKS é chamado no main.go para baixar as chaves assimétricas do Supabase
func InitJWKS() error {
	rawURL := os.Getenv("SUPABASE_URL")
	if rawURL == "" {
		return fmt.Errorf("SUPABASE_URL não definida")
	}

	// Blindagem 3: O Go isola automaticamente apenas a raiz do servidor (Scheme + Host)
	// Isso conserta qualquer caminho extra que tenha sido colado sem querer no .env
	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("falha ao ler URL do Supabase: %w", err)
	}
	baseURL := fmt.Sprintf("%s://%s", parsedURL.Scheme, parsedURL.Host)

	publicKey := os.Getenv("SUPABASE_PUBLIC_KEY")
	jwksURL := baseURL + "/auth/v1/.well-known/jwks.json"

	// Acopla o nosso Transportador HTTP
	client := &http.Client{
		Transport: &authTransport{
			RoundTripper: http.DefaultTransport,
			apiKey:       publicKey,
		},
	}

	options := keyfunc.Options{
		Client:          client,
		RefreshInterval: time.Hour,
		RefreshTimeout:  time.Second * 10,
	}

	// ATENÇÃO: Usando uma nova variável de erro para não sobrescrever a variável global 'jwks'
	var getErr error
	jwks, getErr = keyfunc.Get(jwksURL, options)
	if getErr != nil {
		return fmt.Errorf("falha ao baixar JWKS do Supabase: %w", getErr)
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