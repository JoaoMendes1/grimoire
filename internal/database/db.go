package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() error {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return fmt.Errorf("variável de ambiente DATABASE_URL não foi definida")
	}

	var err error
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("falha ao conectar ao supabase: %w", err)
	}

	query := `
	CREATE TABLE IF NOT EXISTS categories (
		id SERIAL PRIMARY KEY, 
		name TEXT NOT NULL, 
		user_id TEXT NOT NULL, 
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS vocabularies (
		id SERIAL PRIMARY KEY,
		term TEXT NOT NULL, 
		translation TEXT NOT NULL,
		audio_url TEXT,
		status TEXT DEFAULT 'Pendente',
		user_id TEXT DEFAULT '', 
		category_id INT REFERENCES categories(id) ON DELETE SET NULL, 
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pendente';
	ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT '';
	ALTER TABLE vocabularies ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id) ON DELETE SET NULL;
	`
	indices := []string{
		`CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_vocabularies_user_id ON vocabularies(user_id);`,
		`CREATE INDEX IF NOT EXISTS idx_vocabularies_category_id ON vocabularies(category_id);`,
	}

	for _, query := range indices {
			_, err = DB.Exec(query)
			if err != nil {
				return fmt.Errorf("Erro ao criar índice: %v", err)
			}
	}

	fmt.Println("✅ Índices de banco de dados verificados/criados com sucesso.")

	_, err = DB.Exec(query)
	if err != nil {
		return fmt.Errorf("falha ao criar/atualizar tabela: %w", err)
	}

	return nil
}