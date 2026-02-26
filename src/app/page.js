"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Swal from 'sweetalert2';

export default function Home() {
  const [montado, setMontado] = useState(false);
  const [logado, setLogado] = useState(false);
  const [telaAtiva, setTelaAtiva] = useState('dashboard');

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [estoque, setEstoque] = useState([]);

  // ====== NOVAS MEMÓRIAS PARA A BAIXA ======
  const [opDigitada, setOpDigitada] = useState("");
  const [listaBaixa, setListaBaixa] = useState([]);

  useEffect(() => {
    setMontado(true);
  }, []);

  async function buscarEstoque() {
    const { data, error } = await supabase.from('insumos').select('*').order('descricao');
    if (data) setEstoque(data);
    if (error) console.log("Erro:", error);
  }

  async function fazerLogin() {
    if (!email || !senha) return setErro("Preencha e-mail e senha!");
    setCarregando(true); setErro("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      setErro("Credenciais inválidas.");
      setCarregando(false);
    } else {
      setLogado(true); setCarregando(false); buscarEstoque();
    }
  }

  // ====== FUNÇÃO PARA SIMULAR A ADIÇÃO DE UMA OP NA LISTA ======
  function adicionarOpNaLista() {
    if (!opDigitada) return;

    // Por enquanto, vamos simular que encontramos a OP e ela usa a TINTA-01
    const novoItem = {
      id: Date.now(), // Um ID único gerado na hora
      op: opDigitada,
      codigo_insumo: "TINTA-01",
      descricao: "Tinta Preta Secagem Rápida",
      quantidade: 2
    };

    // Pega a lista antiga e adiciona o novo item no final
    setListaBaixa([...listaBaixa, novoItem]);
    setOpDigitada(""); // Limpa o campo para a próxima OP
  }

  function removerItem(idParaRemover) {
    // Filtra a lista mantendo apenas os itens que NÃO tem o ID clicado
    setListaBaixa(listaBaixa.filter(item => item.id !== idParaRemover));
  }

  function confirmarBaixaTotal() {
    if (listaBaixa.length === 0) {
      Swal.fire('Atenção', 'Adicione pelo menos uma OP para baixar.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Confirmar Baixa?',
      text: `Está prestes a dar baixa em ${listaBaixa.length} itens.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--p)',
      cancelButtonColor: '#79747e',
      confirmButtonText: 'Sim, baixar stock!',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {

        // 1. Mostra um alerta de "A Carregar" enquanto fala com a base de dados
        Swal.fire({
          title: 'A processar...',
          text: 'A atualizar a base de dados na nuvem.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // 2. O Loop Mágico: Vai deduzir o stock de cada item da lista
        for (const item of listaBaixa) {
          // Lê o saldo atual na nuvem
          const { data: insumo } = await supabase
            .from('insumos')
            .select('saldo_atual')
            .eq('codigo_id', item.codigo_insumo)
            .single();

          if (insumo) {
            const novoSaldo = insumo.saldo_atual - item.quantidade;

            // Grava o novo saldo reduzido
            await supabase
              .from('insumos')
              .update({ saldo_atual: novoSaldo })
              .eq('codigo_id', item.codigo_insumo);
          }
        }

        // 3. Atualiza os dados no Dashboard e limpa o ecrã
        buscarEstoque();
        setListaBaixa([]);

        Swal.fire('Sucesso!', 'O stock foi atualizado com sucesso.', 'success');
      }
    });
  }

  if (!montado) return null;

  if (!logado) {
    // ... (TELA DE LOGIN MANTIDA IGUAL)
    return (
      <div id="login-screen">
        <div className="login-box">
          <img src="https://diamantesl.com/vipfriday/img/logo.png" alt="Diamantes" className="login-logo" />
          <h3 style={{ color: 'var(--p)', marginTop: 0 }}>Controle Serigrafia</h3>
          <input type="email" className="login-input" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          <input type="password" className="login-input" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="off" />
          <button className="login-btn" onClick={fazerLogin} disabled={carregando}>{carregando ? "VERIFICANDO..." : "ENTRAR NO SISTEMA"}</button>
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
          <div className="sidebar-subtitle">Controle de consumo 3.0</div>
        </div>
        <button className={`menu-btn ${telaAtiva === 'dashboard' ? 'active' : ''}`} onClick={() => { setTelaAtiva('dashboard'); buscarEstoque(); }}>🏠 Estoque Geral</button>
        <button className={`menu-btn ${telaAtiva === 'baixa' ? 'active' : ''}`} onClick={() => setTelaAtiva('baixa')}>📝 Baixa de Insumos</button>
        <div style={{ marginTop: 'auto', padding: '15px' }}>
          <button className="login-btn" style={{ fontSize: '12px', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setLogado(false)}>🚪 Sair do Sistema</button>
        </div>
      </nav>

      <main className="content">

        {/* TELA 1: DASHBOARD */}
        {telaAtiva === 'dashboard' && (
          <div className="card">
            <h2 style={{ color: 'var(--p)' }}>Estoque Atual 📦</h2>
            {estoque.length === 0 ? <p>Carregando dados...</p> : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead><tr style={{ borderBottom: '2px solid #eee' }}><th>Código</th><th>Descrição</th><th>Saldo</th></tr></thead>
                <tbody>
                  {estoque.map(item => (
                    <tr key={item.codigo_id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 0', color: 'var(--ot)' }}>{item.codigo_id}</td>
                      <td style={{ padding: '12px 0' }}>{item.descricao}</td>
                      <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '18px', color: item.saldo_atual <= item.estoque_minimo ? 'var(--er)' : 'var(--p)' }}>{item.saldo_atual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TELA 2: BAIXA DE INSUMOS */}
        {telaAtiva === 'baixa' && (
          <div className="card">
            <h2 style={{ color: 'var(--p)', marginBottom: '20px' }}>Baixa Múltipla de OPs ⚙️</h2>

            {/* CONTROLES DE BUSCA */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              <input
                type="text"
                className="login-input"
                style={{ margin: 0, flex: 1 }}
                placeholder="Escaneie ou digite o número da OP..."
                value={opDigitada}
                onChange={(e) => setOpDigitada(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && adicionarOpNaLista()} // Adiciona ao dar Enter!
              />
              <button className="login-btn" style={{ width: 'auto', padding: '0 25px' }} onClick={adicionarOpNaLista}>
                Adicionar
              </button>
            </div>

            {/* TABELA DE ITENS A BAIXAR */}
            <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '15px', minHeight: '200px' }}>
              {listaBaixa.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--ot)', marginTop: '60px' }}>
                  Nenhuma OP adicionada ainda. Escaneie um código acima.
                </div>
              ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ddd' }}>
                      <th style={{ paddingBottom: '10px' }}>OP</th>
                      <th style={{ paddingBottom: '10px' }}>Insumo</th>
                      <th style={{ paddingBottom: '10px' }}>Qtd</th>
                      <th style={{ paddingBottom: '10px', textAlign: 'center' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaBaixa.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{item.op}</td>
                        <td style={{ padding: '12px 0' }}>{item.codigo_insumo} - {item.descricao}</td>
                        <td style={{ padding: '12px 0' }}>{item.quantidade}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center' }}>
                          <button
                            onClick={() => removerItem(item.id)}
                            style={{ background: 'var(--er)', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* BOTÃO FINAL DE CONFIRMAÇÃO */}
            {listaBaixa.length > 0 && (
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="login-btn" style={{ width: 'auto', padding: '15px 30px', background: 'var(--p)' }} onClick={confirmarBaixaTotal}>
                  CONFIRMAR {listaBaixa.length} BAIXA(S)
                </button>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}