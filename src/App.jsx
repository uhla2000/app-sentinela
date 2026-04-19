import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔑 SUPABASE
const supabase = createClient(
  "https://mjdxepsxlqfbnmmgvmyy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZHhlcHN4bHFmYm5tbWd2bXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODIzMzQsImV4cCI6MjA5MTk1ODMzNH0.-9wGaBqYSR_M273xo-tQu8fYR3TsDM5fcfA5WZwGZX0"
);

export default function App() {
  const [respostas, setRespostas] = useState([]);
  const [paragrafo, setParagrafo] = useState("");
  const [comentario, setComentario] = useState("");
  const [textoBruto, setTextoBruto] = useState("");
  const [ultimoExcluido, setUltimoExcluido] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const carregarDados = async () => {
    const { data } = await supabase
      .from("comentarios")
      .select("*")
      .order("numero", { ascending: true });

    if (data) setRespostas(data);
  };

  // 🔢 Próximo número
  const proximoNumero = () => {
    if (respostas.length === 0) return 1;
    return Math.max(...respostas.map((r) => r.numero || 0)) + 1;
  };

  // ➕ Adicionar manual
  const adicionarComentario = async () => {
    if (!paragrafo || !comentario) return;

    const numero = proximoNumero();

    const { data } = await supabase
      .from("comentarios")
      .insert([
        {
          numero,
          titulo: `Parágrafo ${numero}`,
          texto: comentario,
        },
      ])
      .select();

    if (data) {
      setRespostas([...respostas, ...data]);
      mostrarToast("Comentário salvo ✅");
    }

    setParagrafo("");
    setComentario("");
  };

  // 🗑️ Excluir um
  const excluirComentario = async (item) => {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;

    setUltimoExcluido(item);

    await supabase.from("comentarios").delete().eq("id", item.id);

    setRespostas(respostas.filter((r) => r.id !== item.id));
    mostrarToast("Excluído com sucesso 🗑️");
  };

  // 💥 Excluir todos
  const excluirTodos = async () => {
    if (!window.confirm("Excluir TODOS os comentários?")) return;

    setUltimoExcluido(respostas);

    await supabase.from("comentarios").delete().neq("id", 0);

    setRespostas([]);
    mostrarToast("Todos excluídos 💥");
  };

  // ↩️ Desfazer
  const desfazerExclusao = async () => {
    if (!ultimoExcluido) return;

    const itens = Array.isArray(ultimoExcluido)
      ? ultimoExcluido
      : [ultimoExcluido];

    const { data } = await supabase
      .from("comentarios")
      .insert(
        itens.map((i) => ({
          numero: i.numero,
          titulo: i.titulo,
          texto: i.texto,
        }))
      )
      .select();

    if (data) {
      setRespostas([...respostas, ...data]);
      mostrarToast("Desfeito com sucesso ↩️");
    }

    setUltimoExcluido(null);
  };

  // 🧠 Detecta pergunta
  const ehInicioPergunta = (linha) => {
    const l = linha.trim();
    return (
      l.startsWith("###") ||
      /^\d+\.\s/.test(l) ||
      /^\d+\)\s/.test(l)
    );
  };

  // ⚡ Processar texto
  const processarTexto = async () => {
    if (!textoBruto) return;

    const linhas = textoBruto.split("\n");
    const blocos = [];
    let atual = [];

    linhas.forEach((linha) => {
      if (ehInicioPergunta(linha) && atual.length > 0) {
        blocos.push(atual.join("\n").trim());
        atual = [];
      }
      atual.push(linha);
    });

    if (atual.length > 0) {
      blocos.push(atual.join("\n").trim());
    }

    const base = proximoNumero();

    const novos = blocos.map((bloco, index) => ({
      numero: base + index,
      titulo: `Parágrafo ${base + index}`,
      texto: bloco,
    }));

    const { data } = await supabase
      .from("comentarios")
      .insert(novos)
      .select();

    if (data) {
      setRespostas([...respostas, ...data]);
      mostrarToast("Texto processado 🚀");
    }

    setTextoBruto("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "Arial" }}>
      <h1 style={{ textAlign: "center" }}>📖 Comentários do Estudo</h1>

      {/* Toast */}
      {toast && (
        <div style={toastStyle}>
          {toast}
        </div>
      )}

      {/* Manual */}
      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Parágrafo (opcional)"
          value={paragrafo}
          onChange={(e) => setParagrafo(e.target.value)}
          style={input}
        />

        <textarea
          placeholder="Comentário"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={input}
        />

        <button style={botao} onClick={adicionarComentario}>
          ➕ Adicionar
        </button>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button style={{ ...botao, background: "red" }} onClick={excluirTodos}>
          🗑️ Excluir todos
        </button>

        {ultimoExcluido && (
          <button style={{ ...botao, background: "orange" }} onClick={desfazerExclusao}>
            ↩️ Desfazer
          </button>
        )}
      </div>

      {/* Automático */}
      <div style={{ marginBottom: "20px" }}>
        <textarea
          placeholder="Cole toda a resposta..."
          value={textoBruto}
          onChange={(e) => setTextoBruto(e.target.value)}
          style={input}
        />

        <button style={botao} onClick={processarTexto}>
          ⚡ Processar texto
        </button>
      </div>

      {/* Lista */}
      {respostas.map((item) => (
        <div key={item.id} style={card}>
          <h2>{`Parágrafo ${item.numero}`}</h2>
          <p style={{ whiteSpace: "pre-line" }}>{item.texto}</p>

          <button
            style={{ ...botao, background: "#555" }}
            onClick={() => excluirComentario(item)}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}

// 🎨 estilos
const botao = {
  padding: "10px",
  borderRadius: "8px",
  border: "none",
  background: "#007bff",
  color: "white",
  cursor: "pointer",
};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
};

const card = {
  background: "#f5f5f5",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "15px",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "#333",
  color: "white",
  padding: "10px",
  borderRadius: "8px",
};