# Agente Gerador de Carrosséis para Instagram — Embalagens & Packaging

## Visão Geral

Agente de IA especializado em criar ideias estruturadas de carrosséis para Instagram focados no universo de embalagens e packaging. O agente gera roteiros completos, incluindo textos para cada slide, chamadas para ação e sugestões visuais.

---

## Objetivo

Produzir ideias de carrossel prontas para uso por marcas, designers, consultores ou educadores do setor de embalagens, acelerando a criação de conteúdo relevante e engajador no Instagram.

---

## Entradas (Inputs)

| Campo | Descrição | Exemplo |
|---|---|---|
| `tema` | Assunto principal do carrossel | "Embalagens sustentáveis" |
| `publico_alvo` | Para quem o conteúdo é direcionado | "Pequenos empreendedores" |
| `tom` | Estilo de comunicação desejado | "Educativo", "Inspiracional", "Vendas" |
| `num_slides` | Quantidade de slides (3–12) | `7` |
| `cta` | Chamada para ação final | "Salve este post!" |

---

## Saídas (Outputs)

Para cada carrossel gerado, o agente entrega:

- **Título do carrossel** — headline do slide de capa
- **Slides estruturados**, cada um contendo:
  - Número do slide
  - Título / headline
  - Texto de apoio (2–4 linhas)
  - Sugestão visual (imagem, ícone, mockup)
  - Elemento de design recomendado (cor, estilo)
- **Slide de CTA** — texto de encerramento com chamada para ação
- **Legenda sugerida** para o post (com hashtags)

---

## Exemplos de Temas Gerados

1. **"7 tipos de embalagem sustentável que seus clientes vão amar"**
2. **"Como a embalagem influencia a decisão de compra em 3 segundos"**
3. **"Do esboço à prateleira: o processo de criação de uma embalagem"**
4. **"Erros comuns em embalagens de pequenos negócios (e como corrigir)"**
5. **"Tendências de packaging para 2025"**
6. **"Embalagem vs. Produto: qual vende mais?"**
7. **"Guia de materiais: papel, plástico, vidro e metal"**

---

## Fluxo de Funcionamento

```
[Usuário informa tema + público + tom]
        ↓
[Agente analisa o segmento de embalagens]
        ↓
[Agente estrutura narrativa do carrossel]
        ↓
[Geração dos slides com textos e sugestões visuais]
        ↓
[Revisão de coerência e engajamento]
        ↓
[Entrega do roteiro completo + legenda]
```

---

## Diretrizes de Conteúdo

- **Slide 1 (Capa):** Deve conter uma promessa clara ou curiosidade que gere clique.
- **Slides 2–(N-1) (Conteúdo):** Cada slide entrega um único ponto de valor. Sem informação em excesso.
- **Último slide (CTA):** Sempre terminar com ação clara — salvar, comentar, seguir ou comprar.
- **Limite de texto por slide:** Máximo de 30 palavras visíveis no design.
- **Tom consistente:** Manter o mesmo registro do início ao fim.

---

## Hashtags Sugeridas por Nicho

```
Sustentabilidade:  #embalagenssustentaveis #packaging #greenpackaging
Design:            #designdeembalagem #packagingdesign #branding
Negócios:          #pequenaempresa #empreendedorismo #produtoproprio
Educativo:         #dicasdepackaging #embalagemcerta #marketingvisual
```

---

## Modelo de Prompt para Ativação

```
Crie um carrossel de Instagram com [N] slides sobre [TEMA]
para [PÚBLICO-ALVO]. Tom: [TOM]. Inclua sugestões visuais
para cada slide e finalize com CTA: "[CHAMADA PARA AÇÃO]".
```

---

## Integrações Possíveis

- **Canva API** — geração automática de layouts a partir do roteiro
- **ChatGPT / Claude API** — geração e refinamento dos textos
- **Later / Buffer** — agendamento do post após aprovação
- **Google Sheets** — banco de ideias e histórico de carrosséis gerados

---

## Notas de Implementação

- O agente deve conhecer tendências atuais do setor de embalagens (materiais, regulamentações, design).
- Carrosséis com 7–10 slides tendem a ter maior tempo de engajamento no Instagram.
- Priorizar linguagem direta, visual e com listas sempre que possível.
- Evitar jargões técnicos excessivos ao falar com público de pequenos empreendedores.
