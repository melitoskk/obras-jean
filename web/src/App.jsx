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
import { Sessao, PAPEIS } from './lib/sessao'

// Só os módulos que existem. Compras e Apropriação saíram do rail (PROJETO-v3
// §7.5/§7.6): um ícone cinza que nunca acende promete um produto que não existe.
// Compras volta quando o escritório definir o fluxo de compra; Apropriação volta
// como coluna, não como item de menu.
const MODULOS = [
  { id: 'inicio', label: 'Início', icone: Home, rota: '/' },
  { id: 'clientes', label: 'Clientes', icone: Users, rota: '/clientes' },
  // O orçamento não é um lugar do sistema, é uma aba da obra. Por isso não há item
  // "Orçamentos" no rail - a lista deles seria a lista de obras.
  { id: 'obras', label: 'Obras', icone: Building2, rota: '/obras', prefixo: ['/obra'] },
  { id: 'fornecedores', label: 'Fornecedores', icone: Truck, rota: '/fornecedores' },
  // Itens vem logo depois de Fornecedores: são os dois lados do mesmo vínculo.
  { id: 'itens', label: 'Itens', icone: Package, rota: '/itens' },
  // Não há módulo Financeiro nem Fluxo de caixa: o caixa é sempre de UMA obra, então
  // ele é aba da obra e a "lista de fluxos" seria a lista de Obras de novo - que já
  // traz as colunas A pagar e Caixa. Pagar é marcar "Pago" no próprio lançamento.
  // Contas a pagar (agenda de vencimento, baixa em lote) volta quando doer.
  { id: 'relatorios', label: 'Relatórios', icone: FileText, rota: '/relatorios' },
  { id: 'usuarios', label: 'Usuários', icone: UserCog, rota: '/usuarios', papeis: ['admin'] },
]
// Campo (UPDATE.md §5) só tem as obras dele - diário e galeria moram dentro da obra.
// Os outros papéis veem o que não tiver `papeis` e o que os listar.
const modulosDo = (papel) =>
  papel === 'campo'
    ? MODULOS.filter((m) => m.id === 'obras')
    : MODULOS.filter((m) => !m.papeis || m.papeis.includes(papel))

function Moldura({ usuario, papel, onSair }) {
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const modulos = modulosDo(papel)
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
          {usuario} <span className="text-white/50">· {PAPEIS[papel] ?? papel}</span>
        </span>
        <button onClick={onSair} title="Sair" className="text-white/70 hover:text-white">
          <LogOut size={17} />
        </button>
      </BarraTopo>

      <div className="flex min-h-0 flex-1">
        <Rail modulos={modulos} ativo={ativo} onIr={ir} />
        {papel === 'campo' ? (
          // Rotas do campo: só a lista das obras dele e a tela da obra. O resto cai na
          // lista - a API recusaria de todo jeito, e uma tela vazia de erro não ajuda.
          <Routes>
            <Route path="/obras" element={<Obras />} />
            <Route path="/obra/:id" element={<Obra />} />
            <Route path="*" element={<Navigate to="/obras" replace />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Inicio />} />
            {/* O cadastro é overlay da própria lista: `:id` (ou "novo") abre o modal por
                cima dela. Sai de graça voltar, recarregar e mandar link de um registro. */}
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id" element={<Clientes />} />
            <Route path="/obras" element={<Obras />} />
            {/* Só "nova" continua overlay da lista; obra existente é tela própria. */}
            <Route path="/obras/nova" element={<Obras />} />
            <Route path="/obra/:id" element={<Obra />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/fornecedores/:id" element={<Fornecedores />} />
            <Route path="/itens" element={<Itens />} />
            <Route path="/itens/:id" element={<Itens />} />
            {/* Qual relatório e seus filtros vivem na query (?r=pagamentos&obra=1), não em
                rota filha: relatório novo não pode custar uma rota. */}
            <Route path="/relatorios" element={<Relatorios />} />
            {papel === 'admin' && <Route path="/usuarios" element={<Usuarios />} />}
            {papel === 'admin' && <Route path="/usuarios/:id" element={<Usuarios />} />}
            {/* Orçamento não tem rota: é a aba do cadastro da obra, e só. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>

      {/* pb da barra inferior mora nas páginas: só elas sabem o que rola. */}
      <BarraInferior modulos={modulos} ativo={ativo} onIr={ir} />
    </div>
  )
}

export default function App() {
  // { usuario, papel } - undefined = carregando, null = fora
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
