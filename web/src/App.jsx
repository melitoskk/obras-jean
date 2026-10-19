import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  Home, Users, Building2, Truck, Package, FileText, LogOut, UserCog,
} from 'lucide-react'

import { BarraTopo, Rail, BarraInferior } from './ui/Rail'
import Logo from './ui/Logo'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Clientes from './pages/Clientes'
import Obras from './pages/Obras'
import Obra from './pages/Obra'
import Fornecedores from './pages/Fornecedores'
import Itens from './pages/Itens'
import Relatorios from './pages/Relatorios'
import Usuarios from './pages/Usuarios'
import { getEu, logout } from './lib/api'
import { Sessao } from './lib/sessao'

// Só os módulos que existem. Compras e Apropriação saíram do rail (PROJETO-v3
// §7.5/§7.6): um ícone cinza que nunca acende promete um produto que não existe.
// Compras volta quando o escritório definir o fluxo de compra; Apropriação volta
// como coluna, não como item de menu.
const MODULOS = [
  { id: 'inicio', label: 'Início', icone: Home, rota: '/', precisa: 'ver_valores' },
  { id: 'clientes', label: 'Clientes', icone: Users, rota: '/clientes', precisa: 'cadastros' },
  // O orçamento não é um lugar do sistema, é uma aba da obra. Por isso não há item
  // "Orçamentos" no rail - a lista deles seria a lista de obras.
  { id: 'obras', label: 'Obras', icone: Building2, rota: '/obras', prefixo: ['/obra'] },
  { id: 'fornecedores', label: 'Fornecedores', icone: Truck, rota: '/fornecedores', precisa: 'cadastros' },
  // Itens vem logo depois de Fornecedores: são os dois lados do mesmo vínculo.
  { id: 'itens', label: 'Itens', icone: Package, rota: '/itens', precisa: 'cadastros' },
  // Não há módulo Financeiro nem Fluxo de caixa: o caixa é sempre de UMA obra, então
  // ele é aba da obra e a "lista de fluxos" seria a lista de Obras de novo - que já
  // traz as colunas A pagar e Caixa. Pagar é marcar "Pago" no próprio lançamento.
  // Contas a pagar (agenda de vencimento, baixa em lote) volta quando doer.
  { id: 'relatorios', label: 'Relatórios', icone: FileText, rota: '/relatorios', precisa: 'ver_valores' },
  { id: 'usuarios', label: 'Usuários', icone: UserCog, rota: '/usuarios', precisa: 'usuarios' },
]
// Cada módulo aparece pra quem tem a permissão dele (19/10/2026); Obras, pra todos -
// é onde moram o diário e a galeria.
const modulosDo = (permissoes) => MODULOS.filter((m) => !m.precisa || permissoes.includes(m.precisa))

function Moldura({ usuario, perfil, permissoes = [], onSair }) {
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const modulos = modulosDo(permissoes)
  const tem = (id) => modulos.some((m) => m.id === id)
  // Módulo ativo sai da rota - recarregar a página não perde o destaque no rail.
  // "/" casa exato: com startsWith toda rota casaria com Início. Rotas filhas futuras
  // (/clientes/12) ainda marcam o módulo pai pelo prefixo.
  const ativo = modulos.find((m) =>
    m.rota && (m.rota === '/'
      ? pathname === '/'
      : [m.prefixo ?? m.rota].flat().some((p) => pathname.startsWith(p))),
  )?.id

  const ir = (id) => {
    const rota = modulos.find((m) => m.id === id)?.rota
    if (rota) navegar(rota)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <BarraTopo logo={<Logo />}>
        <span className="hidden text-white/80 sm:inline">
          {usuario} <span className="text-white/50">· {perfil}</span>
        </span>
        <button onClick={onSair} title="Sair" className="text-white/70 hover:text-white">
          <LogOut size={17} />
        </button>
      </BarraTopo>

      <div className="flex min-h-0 flex-1">
        <Rail modulos={modulos} ativo={ativo} onIr={ir} />
        {/* Rota de módulo sem permissão não existe: cai na primeira tela que a pessoa
            tem. A API recusaria de todo jeito, e uma tela vazia de erro não ajuda. */}
        <Routes>
          {tem('inicio') && <Route path="/" element={<Inicio />} />}
          {/* O cadastro é overlay da própria lista: `:id` (ou "novo") abre o modal por
              cima dela. Sai de graça voltar, recarregar e mandar link de um registro. */}
          {tem('clientes') && <Route path="/clientes" element={<Clientes />} />}
          {tem('clientes') && <Route path="/clientes/:id" element={<Clientes />} />}
          <Route path="/obras" element={<Obras />} />
          {/* Só "nova" continua overlay da lista; obra existente é tela própria. */}
          {permissoes.includes('cadastros') && <Route path="/obras/nova" element={<Obras />} />}
          <Route path="/obra/:id" element={<Obra />} />
          {tem('fornecedores') && <Route path="/fornecedores" element={<Fornecedores />} />}
          {tem('fornecedores') && <Route path="/fornecedores/:id" element={<Fornecedores />} />}
          {tem('itens') && <Route path="/itens" element={<Itens />} />}
          {tem('itens') && <Route path="/itens/:id" element={<Itens />} />}
          {/* Qual relatório e seus filtros vivem na query (?r=pagamentos&obra=1), não em
              rota filha: relatório novo não pode custar uma rota. */}
          {tem('relatorios') && <Route path="/relatorios" element={<Relatorios />} />}
          {tem('usuarios') && <Route path="/usuarios" element={<Usuarios />} />}
          {tem('usuarios') && <Route path="/usuarios/:id" element={<Usuarios />} />}
          {/* Orçamento não tem rota: é a aba do cadastro da obra, e só. */}
          <Route path="*" element={<Navigate to={tem('inicio') ? '/' : '/obras'} replace />} />
        </Routes>
      </div>

      {/* pb da barra inferior mora nas páginas: só elas sabem o que rola. */}
      <BarraInferior modulos={modulos} ativo={ativo} onIr={ir} />
    </div>
  )
}

export default function App() {
  // { usuario, perfil, permissoes } - undefined = carregando, null = fora
  const [sessao, setSessao] = useState(undefined)
  useEffect(() => { getEu().then(setSessao).catch(() => setSessao(null)) }, [])

  if (sessao === undefined) return null
  if (!sessao) return <Login onEntrar={setSessao} />

  return (
    <Sessao.Provider value={sessao}>
      <BrowserRouter>
        <Moldura {...sessao} onSair={() => logout().then(() => setSessao(null))} />
      </BrowserRouter>
    </Sessao.Provider>
  )
}
