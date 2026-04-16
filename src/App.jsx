import { useState } from "react";

export default function App() {
  const [respostas, setRespostas] = useState([]);
  const [paragrafo, setParagrafo] = useState("");
  const [comentario, setComentario] = useState("");
  const [textoBruto, setTextoBruto] = useState("");

  // ➕ Adicionar comentário manual
  const adicionarComentario = () => {
    if (!paragrafo || !comentario) return;

    const novo = {
      id: Date.now(),
      titulo: `Parágrafo ${paragrafo}`,
      texto: comentario,
    };

    setRespostas([...respostas, novo]);
    setParagrafo("");
    setComentario("");
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

  // ⚡ Processar texto completo
  const processarTexto = () => {
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
      id: Date.now() + index,
      titulo: `Item ${respostas.length + index + 1}`,
      texto: bloco,
    }));

    setRespostas([...respostas, ...novos]);
    setTextoBruto("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>TESTE DE ANTONIO</h1>

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
          <p style={{ whiteSpace: "pre-line" }}>
            {item.texto}
          </p>
        </div>
      ))}
    </div>
  );
}