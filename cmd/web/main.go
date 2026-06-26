package main 

import (
	"fmt"
	"grimoire/internal/database"
)

func main() {
	fmt.Println("Iniciando Grimoire...")

	err := database.InitDB()
	if err != nil {
		fmt.Printf("Erro crítico no banco de dados: %v\n", err)
		return
	}

	fmt.Println("Banco de dados SQLite iniciado com sucesso! Arquivo vocab.db está pronto ")
}