"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [montado, setMontado] = useState(false);
  const [logado, setLogado] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // NOVO: A memória que vai guardar os insumos que vierem do banco
  const [estoque, setEstoque] = useState([]);

  useEffect(() => {
    setMontado(true);
  }, []);

  // NOVA FUNÇÃO: Vai no Supabase e busca tudo da tabela 'insumos'
  async function buscarEstoque() {
    const { data, error } = await supabase.from('insumos').select('*').order('descricao');

    if (data) {
      setEstoque(data); // Salva os dados na memória do React
    }
    if (error) {
      console.log("Erro ao buscar estoque:", error);
    }
  }

  async function fazerLogin() {
    if (!email || !senha) {
      setErro("Preencha e-mail e senha!");
      return;
    }

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      setErro("Credenciais inválidas. Tente novamente.");
      setCarregando(false);
    } else {
      setLogado(true);
      setCarregando(false);

      // MÁGICA: Assim que logar, ele já puxa os dados do estoque!
      buscarEstoque();
    }
  }

  if (!montado) return null;

  if (!logado) {
    return (
      <div id="login-screen">
        <div className="login-box">
          <img src="https://diamantesl.com/vipfriday/img/logo.png" alt="Diamantes" className="login-logo" />
          <h3 style={{ color: 'var(--p)', marginTop: 0 }}>Controle Serigrafia</h3>

          <input type="email" className="login-input" placeholder="E-mail do Usuário" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          <input type="password" className="login-input" placeholder="Senha secreta" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" />

          <button className="login-btn" onClick={fazerLogin} disabled={carregando}>
            {carregando ? "VERIFICANDO..." : "ENTRAR NO SISTEMA"}
          </button>

          {erro && <div style={{ color: 'var(--er)', marginTop: '10px', fontSize: '13px', fontWeight: 'bold' }}>{erro}</div>}
        </div>
      </div>
    );
  }

  return (
    <div id="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <img src="https://diamantesl.com/vipfriday/img/logo.png" className="logo-img" alt="Logo" />
          <div className="sidebar-subtitle">Controle de consumo serigrafia 3.0</div>
        </div>
        <button className="menu-btn active">🏠 Estoque Geral</button>
        <button className="menu-btn">📝 Gestão de OPs</button>

        <div style={{ marginTop: 'auto', padding: '15px' }}>
          <button className="login-btn" style={{ fontSize: '12px', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setLogado(false)}>
            🚪 Sair do Sistema
          </button>
        </div>
      </nav>

      {/* AQUI ESTÁ A TELA NOVA QUE LÊ OS DADOS */}
      <main className="content">
        <div className="card">
          <h2 style={{ color: 'var(--p)' }}>Estoque Atual 📦</h2>

          {/* Se a lista estiver vazia, mostra mensagem de carregando */}
          {estoque.length === 0 ? (
            <p>Carregando dados do banco...</p>
          ) : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ paddingBottom: '10px' }}>Código</th>
                  <th style={{ paddingBottom: '10px' }}>Descrição</th>
                  <th style={{ paddingBottom: '10px' }}>Saldo Atual</th>
                </tr>
              </thead>
              <tbody>
                {/* O React faz um "loop" e cria uma linha para cada item do banco */}
                {estoque.map(item => (
                  <tr key={item.codigo_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '12px 0', fontWeight: '500', color: 'var(--ot)' }}>{item.codigo_id}</td>
                    <td style={{ padding: '12px 0' }}>{item.descricao}</td>
                    <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '18px', color: item.saldo_atual <= item.estoque_minimo ? 'var(--er)' : 'var(--p)' }}>
                      {item.saldo_atual}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}