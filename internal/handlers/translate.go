package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type TranslateRequest struct {
	Term string `json:"term"`
}

type TranslateResponse struct {
	Translation string `json:"translation"`
}

func TranslateHandler(w http.ResponseWriter, r *http.Request) {
	var req TranslateRequest
	json.NewDecoder(r.Body).Decode(&req)

	if req.Term == "" {
		http.Error(w, "Termo em branco", http.StatusBadRequest)
		return
	}

	textoSeguro := url.QueryEscape(req.Term)
	apiURL := fmt.Sprintf("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=%s", textoSeguro)

	resp, err := http.Get(apiURL)
	if err != nil {
		http.Error(w, "Erro na API de tradução", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var traduzido string
	var dados []interface{}
	
	// Navega no retorno da API do Google para extrair apenas o texto em português
	if err := json.Unmarshal(body, &dados); err == nil && len(dados) > 0 {
		if blocos, ok := dados[0].([]interface{}); ok && len(blocos) > 0 {
			for _, bloco := range blocos {
				if pedaco, ok := bloco.([]interface{}); ok && len(pedaco) > 0 {
					traduzido += fmt.Sprintf("%v", pedaco[0])
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TranslateResponse{Translation: traduzido})
}