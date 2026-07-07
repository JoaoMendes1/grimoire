package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func AuthSupabase(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		// Pergunta diretamente ao Supabase se o token é válido usando suas credenciais públicas
		reqSB, _ := http.NewRequest("GET", "https://krzaopiogbskauhicfvp.supabase.co/auth/v1/user", nil)
		reqSB.Header.Add("Authorization", authHeader)
		reqSB.Header.Add("apikey", "sb_publishable_YBYol7-sdJpw_ULxO04Q_Q_tfTKuVNQ")

		resp, err := http.DefaultClient.Do(reqSB)
		if err != nil || resp.StatusCode != http.StatusOK {
			fmt.Println("⛔ RECUSADO: Supabase rejeitou o token.")
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}
		defer resp.Body.Close()

		// Extrai o ID do usuário da resposta
		var dadosUsuario struct {
			ID string `json:"id"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&dadosUsuario); err != nil || dadosUsuario.ID == "" {
			fmt.Println("⛔ RECUSADO: Falha ao ler ID do usuário.")
			http.Error(w, "Acesso negado", http.StatusUnauthorized)
			return
		}

		// Libera o acesso e envia o ID para o banco de dados
		ctx := context.WithValue(r.Context(), "userID", dadosUsuario.ID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}