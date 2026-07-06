package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq" // MUDANÇA: Importamos o driver do PostgreSQL em vez do SQLite
)

var DB *sql.DB

func InitDB() error {
	// MUDANÇA: Agora pegamos a URL do Supabase através de uma variável de ambiente,
	// para não deixar a sua senha exposta e gravada diretamente no código.
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("variável de ambiente DATABASE_URL não foi definida")
	}

	var err error
	// MUDANÇA: Mudamos o tipo de "sqlite" para "postgres" e usamos a dbURL
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao supabase: %w", err)
	}

	// MUDANÇA: O Postgres não usa "AUTOINCREMENT". No lugar dele, usamos a palavra "SERIAL".
	// Os campos de data e hora também mudam de "DATETIME" para "TIMESTAMP".
	query := `
	CREATE TABLE IF NOT EXISTS vocabularies (
		id SERIAL PRIMARY KEY,
		term TEXT NOT NULL, 
		translation TEXT NOT NULL,
		audio_url TEXT,
		status TEXT DEFAULT 'Pendente',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = DB.Exec(query)
	if err != nil {
		return fmt.Errorf("falha ao criar tabela: %w", err)
	}

	return nil
}