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
      .order("id", { ascending: true });

    if (data) setRespostas(data);
  };

  const adicionarComentario = async () => {
    if (!paragrafo || !comentario) return;

    const { data } = await supabase
      .from("comentarios")
      .insert([
        {
          titulo: `Parágrafo ${paragrafo}`,
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

  const excluirComentario = async (item) => {
    if (!window.confirm("Tem certeza que deseja excluir?")) return;

    setUltimoExcluido(item);

    await supabase.from("comentarios").delete().eq("id", item.id);

    setRespostas(respostas.filter((r) => r.id !== item.id));
    mostrarToast("Excluído com sucesso 🗑️");
  };

  const excluirTodos = async () => {
    if (!window.confirm("Excluir TODOS os comentários?")) return;

    setUltimoExcluido(respostas);

    await supabase.from("comentarios").delete().neq("id", 0);

    setRespostas([]);
    mostrarToast("Todos excluídos 💥");
  };

  const desfazerExclusao = async () => {
    if (!ultimoExcluido) return;

    const itens = Array.isArray(ultimoExcluido)
      ? ultimoExcluido
      : [ultimoExcluido];

    const { data } = await supabase
      .from("comentarios")
      .insert(
        itens.map((i) => ({
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

  const ehInicioPergunta = (linha) => {
    const l = linha.trim();
    return (
      l.startsWith("###") ||
      /^\d+\.\s/.test(l) ||
      /^\d+\)\s/.test(l)
    );
  };

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

    const novos = blocos.map((bloco, index) => ({
      titulo: `Parágrafo ${respostas.length + index + 1}`,
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
      
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        📖 Comentários do Estudo
      </h1>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#333",
            color: "white",
            padding: "10px 15px",
            borderRadius: "8px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Manual */}
      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Parágrafo"
          value={paragrafo}
          onChange={(e) => setParagrafo(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <textarea
          placeholder="Comentário"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
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
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />

        <button style={botao} onClick={processarTexto}>
          ⚡ Processar texto
        </button>
      </div>

      {/* Lista */}
      {respostas.map((item) => (
        <div key={item.id} style={card}>
          <h2>{item.titulo}</h2>
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

// 🎨 estilos reutilizáveis
const botao = {
  padding: "10px 15px",
  border: "none",
  borderRadius: "8px",
  background: "#007bff",
  color: "white",
  cursor: "pointer",
};

const card = {
  background: "#f5f5f5",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "15px",
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
};