# Relatório de Turno AHS – Manutenção Corretiva Mina

Sistema oficial para padronização, geração e exportação de relatórios de turno da manutenção corretiva em frotas autônomas AHS (_Autonomous Haulage System_ - Sotreq / Caterpillar).

A aplicação consolida os atendimentos realizados, gerencia justificativas de atraso com herança cronológica, classifica falhas por taxonomia real de campo (43.773 linhas), monitora a disponibilidade operacional da frota e gera saídas integradas para **WhatsApp**, **Ficha Oficial em PDF (Sotreq CAT)** e **Planilha CSV (Excel / PowerBI)**.

---

## 🚀 Tecnologias

- **Framework:** Next.js 15 (App Router)
- **Biblioteca de UI:** React 19
- **Estilização:** CSS3 Moderno com suporte nativo a impressão A4 (@media print) e layout responsivo mobile-first
- **Persistência:** `localStorage` com recuperação automática e sanitização de rascunhos
- **Taxonomia de Falhas:** JSON estruturado de campo (`src/data/fault-tree.json`)

---

## 🏛️ Estrutura Arquitetural do Projeto

O código é estruturado seguindo princípios de responsabilidade única e Clean Architecture:

```text
relatorioturnoahs/
├── app/
│   ├── globals.css                       # Estilos globais, tema Sotreq CAT, resets mobile iOS e @media print A4
│   ├── layout.jsx                        # Layout raiz com metadata e viewport mobile
│   └── page.jsx                          # Orquestrador principal da página (estado e sincronização)
├── public/
│   └── logo-sotreq.png                   # Identidade visual corporativa oficial Sotreq CAT
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Field.jsx                 # Inputs e textareas padronizados (com fix para iOS Safari)
│   │   │   └── SelectField.jsx           # Dropdown reutilizável com suporte a tags customizadas
│   │   ├── modal/
│   │   │   └── PdfReportModal.jsx        # Modal e layout oficial de impressão da Ficha A4 Sotreq CAT
│   │   ├── preview/
│   │   │   └── WhatsAppPreview.jsx       # Pré-visualização da mensagem formatada para WhatsApp
│   │   └── sections/
│   │       ├── ShiftDataSection.jsx      # Dados do Turno (Data, Turno, Turma, Oficina, Supervisor, Técnicos)
│   │       ├── AppointmentsSection.jsx   # Gestor de atendimentos da manutenção corretiva
│   │       ├── AppointmentItem.jsx       # Card de atendimento com taxonomia em cascata e atrasos filhos
│   │       ├── StoppedSection.jsx        # Gestão de equipamentos parados na mina
│   │       ├── OperatingSection.jsx      # Grid dinâmico de caminhões operando em modo autônomo
│   │       └── FleetSummarySection.jsx   # Indicadores e barras de disponibilidade operacional da frota
│   ├── constants/
│   │   └── index.js                      # Constantes da frota (23 caminhões), status, equipes e justificativas
│   ├── data/
│   │   └── fault-tree.json               # Árvore hierárquica oficial de falhas AHS (43.773 linhas)
│   └── utils/
│       ├── formatters.js                 # Utilitários de prefixo CA/CM, tags, horários, emojis e resumo da frota
│       ├── reportGenerator.js            # Engine de compilação da mensagem oficial para WhatsApp
│       └── exportCsv.js                  # Engine de exportação CSV com UTF-8 BOM e separador ';'
├── jsconfig.json                         # Mapeamento de paths (@/*)
├── package.json
└── README.md
```

---

## ⚡ Principais Funcionalidades

### 1. 📋 Atendimentos & Árvore de Falhas AHS

- Classificação taxonômica oficial em 5 níveis hierárquicos:
  1. **Sistema**
  2. **Conjunto**
  3. **Item**
  4. **Problema**
  5. **Solução**
- **Reset em cascata:** Alterações em níveis superiores limpam e revalidam automaticamente os níveis filhos.
- **Auto-preenchimento:** Quando há apenas uma solução associada à causa na taxonomia, ela é selecionada de imediato.
- **Sincronização de Status:**
  - Status `Liberado` preenche automaticamente o horário de término com a hora local atual e encerra o último atraso.
  - Status `Em manutenção` bloqueia e limpa o horário fim, mantendo o atendimento em aberto.

### 2. ⏳ Gestão Cronológica de Atrasos (Subcódigos Filhos)

- O 1º atraso é obrigatoriamente `AG ATENDIMENTO` e herda o _Horário Início MineStar_.
- Atrasos subsequentes iniciam rigorosamente no instante em que o atraso anterior terminou.
- O término do atendimento acompanha em tempo real o encerramento do último evento de atraso.

### 3. 🚚 Monitoramento da Frota Autônoma

- Frota base de 23 caminhões:
  - **CAT 797F:** CA55xx (12 caminhões)
  - **CAT 794 AC:** CA57xx (11 caminhões)
- **Cálculo dinâmico:** Qualquer caminhão lançado em _Equipamentos Parados_ ou em _Atendimento ativo_ sai automaticamente da rota autônoma e contabiliza em manutenção.
- **Taxas de disponibilidade:** Cartões estatísticos com porcentagens e barras de progresso operacionais.

### 4. 📄 Ficha Oficial em PDF (Sotreq CAT)

- Layout rigorosamente fiel aos comunicados industriais de campo:
  - Moldura perimetral amarela oficial Caterpillar.
  - Cabeçalho padronizado com logotipo Sotreq CAT.
  - Linhas de rótulo neutras e tabelas limpas.
  - **Rodapé industrial:** Barra preta chanfrada na logo Sotreq CAT e 3 pilares em SVG amarelo (_Disciplina_, _Confiabilidade_, _Parceria_).
  - Folha A4 portrait com regras `@media print` para eliminar páginas em branco indesejadas.

### 5. 💬 Integração WhatsApp

- Saída textual limpa, com formatação rica em emojis operacionais:
  - 🟢 Autônomo
  - 🟡 MPS (9600)
  - 🟠 MPNS (9100)
  - 🔴 HMC (9200) / HAC (9700)
- Botões de **Copiar Mensagem** (para colar em qualquer conversa) e **Abrir no WhatsApp Web/Mobile**.

### 6. 📊 Exportação em CSV (Excel / PowerBI)

- Codificação **UTF-8 com BOM** e separador de colunas `;` (padrão regional Excel brasileiro).
- Higienização automática: todos os emojis são removidos das células para garantir integridade analítica no PowerBI/bancos de dados.

### 7. 📱 Otimização Mobile (iOS Safari & iPhone 15)

- Reset completo de `input[type="datetime-local"]` e `type="date"` prevenindo quebras de layout causadas por larguras intrínsecas do WebKit.
- Fontes com tamanho mínimo de 16px para desativar o auto-zoom invasivo do Safari ao focar nos campos.
- Espaçamento confortável (`margin-bottom`) em cabeçalhos de seção e botões.

---

## 🛠️ Comandos de Instalação e Execução

### Instalar Dependências

```bash
npm install
```

### Rodar Ambiente de Desenvolvimento

```bash
npm run dev
```

Acesse no navegador: `http://localhost:3000`

### Gerar Build de Produção

```bash
npm run build
```

### Iniciar Build de Produção

```bash
npm run start
```

---

## 📜 Licença e Governança

Desenvolvido para governança operacional e controle de turno AHS da **Sotreq / Caterpillar**.  
Mentor: **Gamamaru** | Engenheiro Responsável: **Pedro Henrique (DevJiraya)**.

### 🏛️ Nova Estrutura Arquitetural do Projeto

    src/
    ├── components/
    │   ├── modal/
    │   │   └── PdfReportModal.jsx       # 📄 Gerador da Ficha PDF / Impressão Oficial Sotreq CAT
    │   ├── preview/
    │   │   └── WhatsAppPreview.jsx      # 💬 Saída formatada WhatsApp (Copiar, Abrir, CSV)
    │   ├── sections/
    │   │   ├── ShiftDataSection.jsx     # 🕒 Dados do Turno (Data, Turno, Turma, Oficina, etc.)
    │   │   ├── AppointmentsSection.jsx  # 📋 Lista de Atendimentos da Manutenção
    │   │   ├── AppointmentItem.jsx      # 🛠️ Card individual de atendimento com taxonomia em cascata e atrasos
    │   │   ├── StoppedSection.jsx       # 🚚 Equipamentos Parados (com add/remove e layout mobile)
    │   │   ├── OperatingSection.jsx     # 🟢 Equipamentos Operando Autônomo (chips dinâmicos)
    │   │   └── FleetSummarySection.jsx  # 📊 Resumo da Frota (Total, CAT 797F e CAT 794 AC com barras de progresso)
    │   └── common/
    │       ├── Field.jsx                # 🔲 Input e Textarea reutilizáveis (com fix para iOS)
    │       └── SelectField.jsx          # 🔽 Dropdown customizável com suporte a tags
    ├── constants/
    │   └── index.js                     # 📌 Constantes de frota, códigos de manutenção, justificativas e emojis
    └── utils/
        ├── formatters.js                # ⚙️ Utilitários de data, tag CA/CM, emojis, taxonomia e cálculo de frota
        ├── reportGenerator.js           # ✍️ Gerador do texto oficial de saída para WhatsApp
        └── exportCsv.js                 # 📊 Exportador de CSV limpo com UTF-8 BOM e separador ';'
