package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB abre a conexão e confere se o schema esperado existe.
//
// Ele NÃO cria nem altera tabela. O schema vive em sql/, versionado e aplicado à
// mão — ver sql/README.md. Até 19/09/2026 as tabelas eram criadas aqui com
// CREATE TABLE IF NOT EXISTS, e isso escondeu uma divergência por semanas:
// alguém alterou vocabularies.user_id para uuid no Supabase, o Go continuou
// declarando TEXT, e o boot seguiu anunciando "schema verificado com sucesso".
// IF NOT EXISTS cria, mas nunca altera.
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

	// sql.Open não conversa com o banco: ele só valida os argumentos. Sem o Ping,
	// a primeira falha de conexão apareceria como erro de consulta no meio de uma
	// requisição, com o servidor já no ar dizendo que subiu.
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("banco não respondeu: %w", err)
	}

	if err := conferirSchema(); err != nil {
		return err
	}

	fmt.Println("✅ Conexão e schema conferidos.")
	return nil
}

// conferirSchema recusa subir se faltar tabela que o código usa.
//
// É o mesmo raciocínio do fail-fast das variáveis de ambiente no main.go: banco
// sem a tabela produz erro tardio e confuso, no meio de uma requisição, quando a
// causa é que o arquivo sql/ nunca foi aplicado.
func conferirSchema() error {
	tabelas := []string{"vocabularies", "categories"}

	for _, tabela := range tabelas {
		var existe bool
		err := DB.QueryRow(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.tables
				WHERE table_schema = 'public' AND table_name = $1
			)`, tabela).Scan(&existe)
		if err != nil {
			return fmt.Errorf("falha ao conferir a tabela %s: %w", tabela, err)
		}
		if !existe {
			return fmt.Errorf(
				"tabela %q não existe: aplique os arquivos de sql/ no Supabase antes de subir",
				tabela,
			)
		}
	}

	return nil
}