# Backlog Futuro — Site de Confirmação de Presença (Anti-Penetra)

**Data:** 23/07/2026
**Contexto:** Fases 0–5 do MVP concluídas (fundação, RSVP, anti-penetra, painel, monetização, aquisição). Este documento reúne frentes de evolução **pós-lançamento** — não fazem parte do MVP e devem ser priorizadas com base nos dados do primeiro evento-piloto real.

---

## Como usar este backlog
Não abrir nenhuma dessas frentes antes de rodar um evento-piloto e observar onde o produto trava ou onde há demanda real. Cada item pode virar um "prompt de código" no mesmo formato das Fases 1–5 quando for priorizado.

---

## 1. Validação offline na porta  ⭐ (prioridade prática alta)
**Problema:** salões/sítios costumam ter internet ruim; se a validação depende de rede, a porta trava.
**Ideia:** o app do validador baixa a lista de credenciais válidas do evento ao abrir (com conexão), e valida localmente; sincroniza os check-ins quando a rede voltar.
**Cuidados:** resolver conflito de uso duplo offline (mesma credencial lida em dois portões sem rede) — definir regra de reconciliação na sincronização.
**Impacto:** confiabilidade do diferencial. **Esforço:** médio-alto.

## 2. WhatsApp Business API (envio automático)
**Problema:** o add-on atual (`wa.me`) abre o WhatsApp com a mensagem pronta, mas exige disparo manual, um a um.
**Ideia:** integrar a WhatsApp Business API (ou provedor tipo Twilio/360dialog) para envio automático de convites e lembretes em massa.
**Cuidados:** custo por mensagem, aprovação de templates pela Meta, opt-in dos convidados.
**Impacto:** conveniência premium. **Esforço:** médio (+ custo recorrente).

## 3. B2B / White-label  💰 (maior potencial de receita)
**Problema:** o consumidor final usa uma vez; cerimonialistas, buffets e casas de festa usam toda semana.
**Ideia:** conta multi-evento com marca própria (logo, cores, domínio), gestão de vários eventos, e cobrança por assinatura recorrente.
**Sub-itens:** painel de agência, membros de equipe, relatórios consolidados, planos mensais.
**Impacto:** transforma o modelo de pay-per-event em recorrência. **Esforço:** alto.

## 4. Extras de RSVP / gestão do evento
- **Mesas / distribuição de lugares** — alocar convidados em mesas, mapa visual.
- **Preferências de menu / restrições alimentares** — campo no RSVP + relatório pro buffet.
- **Lista de presentes** integrada (ou link para serviço externo).
- **Lembretes automáticos** para quem não respondeu (e-mail/WhatsApp).
**Impacto:** aumenta valor percebido e retenção. **Esforço:** variável por item.

## 5. Melhorias no anti-penetra
- **Foto do convidado** na validação (conferência visual reforçada).
- **Credencial com nome + antifraude visual** (evita print compartilhado).
- **Múltiplos portões com relatório por entrada** (qual portão, horário de pico).
- **Reentrada controlada** (permitir sair e voltar, se o evento exigir).
**Impacto:** fortalece o diferencial. **Esforço:** baixo-médio.

## 6. Analytics e crescimento
- Dashboard de métricas do produto (eventos criados, taxa de confirmação, taxa de presença).
- Funil de conversão free → pago.
- Programa de indicação (organizador convida outro organizador).
**Impacto:** orienta decisões de produto e aquisição. **Esforço:** médio.

## 7. Confiabilidade e operação
- Testes automatizados (unit + e2e do fluxo crítico de check-in).
- Monitoramento/alertas (erros, filas de webhook do pagamento).
- Backup e política de retenção de dados (LGPD — dados de convidados).
- Página de status.
**Impacto:** essencial ao escalar. **Esforço:** médio, contínuo.

---

## Ordem de priorização sugerida (a revisar após o piloto)
1. **Validação offline** — remove o maior risco operacional do diferencial.
2. **Melhorias no anti-penetra** — ganhos baratos que reforçam o que vende.
3. **B2B / white-label** — quando houver tração no consumidor, mira a receita recorrente.
4. **Extras de RSVP** e **WhatsApp API** — conforme pedidos dos usuários.
5. **Analytics/crescimento** e **confiabilidade/LGPD** — em paralelo, conforme o volume cresce.

> Regra de ouro: deixar os dados do piloto e dos primeiros clientes reordenarem esta lista.
