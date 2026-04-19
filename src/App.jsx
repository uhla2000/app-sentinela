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

  // 🗑️ EXCLUIR UM (com confirmação)
  const excluirComentario = async (item) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir?");
    if (!confirmar) return;

    setUltimoExcluido(item);

    await supabase.from("comentarios").delete().eq("id", item.id);

    setRespostas(respostas.filter((r) => r.id !== item.id));
  };

  // 💥 EXCLUIR TODOS (com confirmação)
  const excluirTodos = async () => {
    const confirmar = window.confirm("Tem certeza que deseja excluir TODOS?");
    if (!confirmar) return;

    setUltimoExcluido(respostas);

    await supabase.from("comentarios").delete().neq("id", 0);

    setRespostas([]);
  };

  // ↩️ DESFAZER
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

    if (data) setRespostas([...respostas, ...data]);

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

      {/* 💥 Excluir todos */}
      <button
        onClick={excluirTodos}
        style={{
          marginBottom: "10px",
          background: "red",
          color: "white",
          padding: "10px",
        }}
      >
        Excluir todos
      </button>

      {/* ↩️ Desfazer */}
      {ultimoExcluido && (
        <button
          onClick={desfazerExclusao}
          style={{
            marginBottom: "20px",
            background: "orange",
            color: "black",
            padding: "10px",
          }}
        >
          Desfazer exclusão
        </button>
      )}

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

          <button
            onClick={() => excluirComentario(item)}
            style={{ background: "gray", color: "white" }}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  );
}