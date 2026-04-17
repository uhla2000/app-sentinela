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

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data } = await supabase
      .from("comentarios")
      .select("*")
      .order("id", { ascending: true });

    if (data) setRespostas(data);
  };

  // ➕ Adicionar
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

    if (data) setRespostas([...respostas, ...data]);

    setParagrafo("");
    setComentario("");
  };

  // 🗑️ EXCLUIR UM
  const excluirComentario = async (id) => {
    await supabase.from("comentarios").delete().eq("id", id);
    setRespostas(respostas.filter((item) => item.id !== id));
  };

  // 💥 EXCLUIR TODOS
  const excluirTodos = async () => {
    await supabase.from("comentarios").delete().neq("id", 0);
    setRespostas([]);
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

    const novos = blocos.map((bloco, index) => ({
      titulo: `Item ${respostas.length + index + 1}`,
      texto: bloco,
    }));

    const { data } = await supabase
      .from("comentarios")
      .insert(novos)
      .select();

    if (data) setRespostas([...respostas, ...data]);

    setTextoBruto("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Comentários do Estudo</h1>

      {/* Manual */}
      <div style={{ marginBottom: "20px" }}>
        <input
          placeholder="Parágrafo"
          value={paragrafo}
          onChange={(e) => setParagrafo(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <textarea
          placeholder="Comentário"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button onClick={adicionarComentario}>
          Adicionar
        </button>
      </div>

      {/* 💥 Botão excluir todos */}
      <button
        onClick={excluirTodos}
        style={{
          marginBottom: "20px",
          background: "red",
          color: "white",
          padding: "10px",
        }}
      >
        Excluir todos
      </button>

      {/* Automático */}
      <div style={{ marginBottom: "20px" }}>
        <textarea
          placeholder="Cole toda a resposta..."
          value={textoBruto}
          onChange={(e) => setTextoBruto(e.target.value)}
          style={{ width: "100%", marginBottom: "10px" }}
        />

        <button onClick={processarTexto}>
          Separar e salvar
        </button>
      </div>

      {/* Lista */}
      {respostas.map((item) => (
        <div key={item.id} style={{ marginBottom: "15px" }}>
          <h2>{item.titulo}</h2>
          <p style={{ whiteSpace: "pre-line" }}>{item.texto}</p>

          {/* 🗑️ Botão excluir individual */}
          <button
            onClick={() => excluirComentario(item.id)}
            style={{ background: "gray", color: "white" }}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}