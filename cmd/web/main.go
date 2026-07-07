package main

import (
	"fmt"
	"net/http"
	"os"

	"grimoire/internal/database"
	"grimoire/internal/handlers"

	// Importar a nova pasta de segurança
	"grimoire/internal/middleware"

	"github.com/go-chi/chi/v5"
)

func main() {
	if os.Getenv("APP_PIN") == "" {
		fmt.Println("Erro crítico: Variável de ambiente APP_PIN não definida. Defina uma senha segura antes de iniciar o servidor.")
		os.Exit(1)
	}


	fmt.Println("Iniciando Grimoire...")

	err := database.InitDB()
	if err != nil {
		fmt.Printf("Erro crítico no banco: %v\n", err)
		return
	}

	r := chi.NewRouter()

// 1. Tela visual livre de bloqueios
	fs := http.FileServer(http.Dir("static"))
	r.Handle("/*", fs)

	// 2. Proteção aplicada apenas nas rotas de processamento usando "r.With"
	r.With(middleware.AuthPIN).Post("/api/translate", handlers.TranslateHandler)
	r.With(middleware.AuthPIN).Post("/api/audio", handlers.AudioHandler)

	r.With(middleware.AuthPIN).Post("/api/words", handlers.SaveWordHandler)
	r.With(middleware.AuthPIN).Get("/api/words", handlers.ListWordsHandler)

	// Rota para deletar uma palavra específica
	r.With(middleware.AuthPIN).Delete("/api/words/{id}", handlers.DeleteWordHandler)

	// Lê a porta que a nuvem fornecer. Se estiver vazio usa a 8080 (para testes locais)
	porta := os.Getenv("PORT")
	if porta == "" {
		porta = "8080"
	}

	fmt.Println("Servidor rodando na porta", porta, "...")

	// Usa a porta dinâmica 
	err = http.ListenAndServe(":"+porta, r)
	if err != nil {
		fmt.Println("Erro FATAL NO SERVIDOR:", err)
	}
}