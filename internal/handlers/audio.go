package handlers

import (
	"encoding/json"
	"fmt"
	"grimoire/internal/models"
	"net/http"
	"net/url"
	"unicode/utf8" // NOVO: Pacote para contar os caracteres corretamente
)

func AudioHandler(w http.ResponseWriter, r *http.Request) {
	var req models.AudioRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.Term == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.AudioResponse{Error: "Termo em branco"})
		return
	}

	// 🛡️ SOLUÇÃO DO BUG: Verifica o tamanho do texto
	// Se tiver mais de 200 caracteres, devolve URL vazia para forçar o Plano B (voz nativa) no Frontend
	if utf8.RuneCountInString(req.Term) > 200 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.AudioResponse{AudioURL: ""})
		return
	}

	textoSeguro := url.QueryEscape(req.Term)
	urlAudio := fmt.Sprintf("https://translate.google.com/translate_tts?ie=UTF-8&q=%s&tl=en&client=tw-ob", textoSeguro)

	res := models.AudioResponse{AudioURL: urlAudio}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}