import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import Registro from '../ui/Registro'
import Arvore from '../ui/Arvore'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa from '../ui/Faixa'
import { getCatalogo, salvarFases } from '../lib/api'

// Escolha das fases e serviços - Obra-Prima-Fases-do-orcamento.png.
// Marcar cria no orçamento; desmarcar exclui, mas o servidor só apaga o que está vazio
// e devolve em `mantidas` o que se recusou a apagar. A tela conta isso em vez de mentir
// que deu tudo certo.
//
// Dois consumidores desde 14/08/2026: a aba Fases do cadastro da OBRA (inline, que é
// onde a pessoa pensa "de que a obra é feita") e o módulo Orçamento (em painel, pra
// quem já está mexendo em valor). Por isso o corpo é separado da casca.
//
// A fase criada aqui é da OBRA; o serviço marcado é deste orçamento. `garantirOrcamento`
// existe pro caso da obra por causa do serviço, não da fase: quem está escolhendo de que
// a obra é feita não quer saber que documento existe. Se não houver orçamento, ele é
// criado na hora do Salvar - nunca ao abrir a tela.
export function FasesCatalogo({
  orcamentoId, garantirOrcamento, fases: jaTem = [], servicos: jaTemServ = [], onSalvo, onFechar,
}) {
  const [cat, setCat] = useState(null)
  const [marcados, setMarcados] = useState(() => new Set())
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    getCatalogo().then(setCat).catch(() => setFaixa({ tipo: 'erro', texto: 'Não foi possível carregar o catálogo.' }))
  }, [])

  // Estado inicial = o que o orçamento já tem. Ids do catálogo, prefixados pra fase e
  // serviço não colidirem num Set só.
  //
  // A dependência é a STRING de ids, não os arrays: quem chama passa `fases ?? []`, e
  // um `[]` literal é um array novo a cada render - o efeito rodava sempre e zerava a
  // seleção logo depois do clique. Com a string, só muda quando o conteúdo muda.
  const idsSalvos = [
    ...jaTem.filter((f) => f.catalogo_id).map((f) => `f${f.catalogo_id}`),
    ...jaTemServ.filter((s) => s.catalogo_id).map((s) => `s${s.catalogo_id}`),
  ].join(',')
  useEffect(() => {
    setMarcados(new Set(idsSalvos ? idsSalvos.split(',') : []))
  }, [idsSalvos])

  const nos = useMemo(
    () =>
      (cat?.fases ?? []).map((f) => ({
        id: `f${f.id}`,
        label: `${f.codigo} - ${f.nome}`,
        filhos: (cat.servicos ?? [])
          .filter((s) => s.fase_catalogo_id === f.id)
          .map((s) => ({ id: `s${s.id}`, label: `${f.codigo}.${s.codigo} - ${s.nome}` })),
      })),
    [cat],
  )

  // Regra de domínio, por isso vive aqui e não em ui/Arvore: marcar um serviço arrasta
  // a fase junto (serviço órfão não existe), e desmarcar a fase leva os serviços dela.
  const marcar = (no, on, pai) =>
    setMarcados((s) => {
      const n = new Set(s)
      on ? n.add(no.id) : n.delete(no.id)
      if (on && pai) n.add(pai.id)
      if (on && !pai) (no.filhos ?? []).forEach((f) => n.add(f.id))
      if (!on && !pai) (no.filhos ?? []).forEach((f) => n.delete(f.id))
      return n
    })

  const marcarVarios = (ids, on) =>
    setMarcados((s) => {
      const n = new Set(s)
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)))
      return n
    })

  async function salvar() {
    setSalvando(true)
    try {
      const id = orcamentoId ?? (await garantirOrcamento())
      const num = (p) => [...marcados].filter((k) => k[0] === p).map((k) => Number(k.slice(1)))
      const { mantidas } = await salvarFases(id, num('f'), num('s'))
      onSalvo?.()
      if (mantidas?.length) {
        setFaixa({
          tipo: 'aviso',
          texto: `Salvo. ${mantidas.length} item(ns) mantidos por já terem valor ou lançamento: ${mantidas.join(', ')}.`,
        })
      } else if (onFechar) {
        onFechar()
      } else {
        setFaixa({ tipo: 'sucesso', texto: 'Operação executada com sucesso.' })
      }
    } catch (e) {
      // Erro vai pro console também: faixa vermelha diz QUE falhou, o console diz por quê.
      console.error('salvar fases:', e)
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {faixa && <Faixa tipo={faixa.tipo} ms={9000} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      {cat ? (
        <Arvore nos={nos} marcados={marcados} onMarcar={marcar} onMarcarVarios={marcarVarios} />
      ) : (
        <p className="p-4 text-[#999]">Carregando catálogo…</p>
      )}
      {/* `sticky bottom-0`: a árvore tem 21 fases e rola muito. Botão no fim da lista é
          botão que ninguém acha - fica colado no rodapé da área visível.
          Sem `-mx-4`: este corpo tem duas molduras (inline na aba da obra e dentro de um
          Registro em modal) e só a segunda tem `p-4` pra sangrar. Na primeira o negativo
          virava 32px de scroll horizontal. Barra encostada na borda não vale um
          componente que adivinha o padding do pai. */}
      <div className="sticky bottom-0 z-10 mt-2">
        <BarraAcao esquerda={<span className="text-[#777]">{marcados.size} selecionado(s)</span>}>
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando || !cat}>Salvar</Botao>
        </BarraAcao>
      </div>
    </div>
  )
}
