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
  const [pressed, setPressed] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const ordenarPorNumero = (lista) => {
    return [...lista].sort((a, b) => a.numero - b.numero);
  };

  const carregarDados = async () => {
    const { data } = await supabase
      .from("comentarios")
      .select("*")
      .order("numero", { ascending: true });

    if (data) setRespostas(data);
  };

  const proximoNumero = () => {
    if (respostas.length === 0) return 1;
    return Math.max(...respostas.map((r) => r.numero || 0)) + 1;
  };

  const adicionarComentario = async () => {
    if (!comentario) return;

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
      setRespostas(ordenarPorNumero([...respostas, ...data]));
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
    mostrarToast("Excluído 🗑️");
  };

  const excluirTodos = async () => {
    if (!window.confirm("Excluir TODOS?")) return;

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
          numero: i.numero,
          titulo: i.titulo,
          texto: i.texto,
        }))
      )
      .select();

    if (data) {
      setRespostas(ordenarPorNumero([...respostas, ...data]));
      mostrarToast("Desfeito ↩️");
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
      setRespostas(ordenarPorNumero([...respostas, ...data]));
      mostrarToast("Texto processado 🚀");
    }

    setTextoBruto("");
  };

  return (
    <div style={container}>
      <h1 style={titulo}>📖 Comentários do Estudo</h1>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ marginBottom: "20px" }}>
        <textarea
          placeholder="Comentário"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={input}
        />

        <button
          style={{
            ...botao,
            ...(pressed === "add" ? botaoPressionado : {}),
          }}
          onMouseDown={() => setPressed("add")}
          onMouseUp={() => setPressed(null)}
          onClick={adicionarComentario}
        >
          ➕ Adicionar
        </button>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          style={{ ...botao, background: "#e74c3c" }}
          onClick={excluirTodos}
        >
          🗑️ Excluir todos
        </button>

        {ultimoExcluido && (
          <button
            style={{ ...botao, background: "#f39c12" }}
            onClick={desfazerExclusao}
          >
            ↩️ Desfazer
          </button>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <textarea
          placeholder="Cole o texto..."
          value={textoBruto}
          onChange={(e) => setTextoBruto(e.target.value)}
          style={input}
        />

        <button style={botao} onClick={processarTexto}>
          ⚡ Processar texto
        </button>
      </div>

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

// 🎨 ESTILOS

const container = {
  padding: "20px",
  maxWidth: "800px",
  margin: "0 auto",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #e0f7fa, #ffffff)",
  fontFamily: "Arial",
};

const titulo = {
  textAlign: "center",
  marginBottom: "20px",
};

const botao = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(145deg, #4facfe, #00f2fe)",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 4px 0 #0077aa, 0 6px 10px rgba(0,0,0,0.2)",
};

const botaoPressionado = {
  transform: "translateY(2px)",
  boxShadow: "0 2px 0 #0077aa",
};

const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #ddd",
};

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "15px",
  marginBottom: "15px",
  boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
};

const toastStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  background: "#333",
  color: "white",
  padding: "10px 15px",
  borderRadius: "8px",
};