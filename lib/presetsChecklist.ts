// Presets de checklist ao criar uma tarefa (redesign v144, Parte 3) — atalho
// pra não digitar os mesmos passos toda vez numa edição parecida. A pessoa
// ainda pode editar/apagar/adicionar itens livremente depois de escolher um,
// ou simplesmente digitar os próprios itens sem usar preset nenhum.
export type PresetChecklist = { nome: string; itens: string[] };

export const PRESETS_CHECKLIST: PresetChecklist[] = [
  {
    nome: "Básico",
    itens: ["Corte sem som", "Remover ruído", "Colocar música", "Colocar legenda", "Colocar logo"],
  },
  {
    nome: "Virais / edições criativas",
    itens: [
      "Roteiro mais dinâmico",
      "Cortes rápidos, sem tempo morto",
      "Efeitos, zoom e transições",
      "Colocar música",
      "Colocar legenda",
      "Colocar logo",
    ],
  },
];
