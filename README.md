# Cápsula ⏳

O **Cápsula** é um MVP focado em design especulativo e captura de momentos. A proposta é simples e imersiva: o usuário registra uma imagem e uma Inteligência Artificial Generativa analisa o contexto visual, retornando uma reflexão poética curta que é eternizada em um banco de dados.

Este projeto foi desenvolvido com forte auxílio de IA (Copilot / Gemini) para acelerar a validação do design e do fluxo de uso.

## 🛠️ Tecnologias Utilizadas
* **Front-end:** React + Vite
* **Estilização:** Tailwind CSS (em implementação)
* **Inteligência Artificial:** Google Gemini (1.5 Flash) via `@google/generative-ai`
* **Banco de Dados (BaaS):** Supabase

## ✨ Funcionalidades do MVP
1. **Captura Visual:** Integração com a câmera do dispositivo para registro do momento.
2. **Reflexão (IA):** Envio da imagem em Base64 para o Google AI Studio, que gera uma síntese poética do instante.
3. **Persistência:** Salvamento do momento (Pin) contendo ID, imagem/descrição e carimbo de tempo no Supabase.

## 🚀 Como rodar o projeto localmente

1. **Instale as dependências:**
   ```bash
   npm install