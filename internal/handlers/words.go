package handlers

import (
	"database/sql"
	"encoding/json"
	"grimoire/internal/database"
	"net/http"
	"fmt"

	"github.com/go-chi/chi/v5"
)

// Estruturas para receber e enviar dados das palavras
type WordRequest struct {
	Term        string `json:"term"`
	Translation string `json:"translation"`
	AudioURL    string `json:"audioUrl"`
}

type WordResponse struct {
	ID          int    `json:"id"`
	Term        string `json:"term"`
	Translation string `json:"translation"`
	AudioURL    string `json:"audioUrl"`
	Status      string `json:"status"`
}

// SaveWordHandler grava uma nova palavra no banco de dados
func SaveWordHandler(w http.ResponseWriter, r *http.Request) {
	var req WordRequest
	json.NewDecoder(r.Body).Decode(&req)

	// MUDANÇA 1: O Postgres exige os números ($1, $2, $3) em vez de interrogações (?, ?, ?)
	// MUDANÇA 2: Como não dá mais para usar "LastInsertId()", pedimos para o comando devolver o ID gerado adicionando "RETURNING id" no final.
	comando := `INSERT INTO vocabularies (term, translation, audio_url) VALUES ($1, $2, $3) RETURNING id`
	
	var id int64
	err := database.DB.QueryRow(comando, req.Term, req.Translation, req.AudioURL).Scan(&id)

	if err != nil {
		// DEDO-DURO: Agora o terminal vai gritar em vermelho exatamente qual foi o erro
		fmt.Println("🚨 ERRO AO INSERIR NO BANCO:", err) 
		http.Error(w, "Falha ao salvar no banco", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int64{"id": id})
}

// ListWordsHandler lista todas as palavras salva do banco de dados
func ListWordsHandler(w http.ResponseWriter, r *http.Request) {
	// MUDANÇA: Como aqui não injetamos nenhuma variável (como o $1), o SELECT continua idêntico.
	linhas, err := database.DB.Query(`SELECT id, term, translation, audio_url, status FROM vocabularies ORDER BY id DESC`)
	if err != nil {
		http.Error(w, "Falha ao buscar dados", http.StatusInternalServerError)
		return
	}

	defer linhas.Close()

	var words []WordResponse
	for linhas.Next() {
		var word WordResponse
		var audioURL, status sql.NullString 

		err := linhas.Scan(&word.ID, &word.Term, &word.Translation, &audioURL, &status)
		if err != nil {
			continue 
		}

		if audioURL.Valid {
			word.AudioURL = audioURL.String
		}
		if status.Valid {
			word.Status = status.String 
		}

		words = append(words, word)
	}

	if words == nil {
		words = []WordResponse{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(words)
}

func DeleteWordHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	// MUDANÇA 4: Troca da interrogação (?) pelo cifrão numerado ($1)
	_, err := database.DB.Exec("DELETE FROM vocabularies WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Erro ao apagar", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}