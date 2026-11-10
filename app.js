(() => {
"use strict";

/* ============ Constantes ============ */
const KEY = "triangle-agency:personagem:v1";
const QUALIDADES = ["Atenção","Duplicidade","Dinamismo","Empatia","Iniciativa","Persistência","Presença","Profissionalismo","Sutileza"];

// Códigos impressos em cada caixa dos medidores de Equilíbrio (caixa 1 a 30).
// Conferir com o livro: se algum estiver errado, é só ajustar aqui.
const CODES = {
  competencia: {3:"A3",6:"D4",9:"G3",12:"J3",15:"N3",18:"Q3",21:"T3",24:"W8",27:"Y2"},
  realidade:   {1:"C4",4:"L11",8:"E2",10:"O4",14:"T6",16:"V2",20:"X3",22:"H5",26:"E3"},
  anomalia:    {1:"H4",2:"H3",5:"U2",7:"X2",11:"N1",13:"Q2",17:"L10",19:"G8",23:"A7"}
};
// Faixa aproximada de cada cargo ao longo do medidor de Competência
const CARGOS = [[1,"Estagiário"],[3,"Associado"],[6,"Associado Sênior"],[9,"Diretor Assistente"],[12,"Diretor"],
  [16,"Diretor Regional"],[19,"Vice-Presidente"],[22,"Vice-Presidente Sênior"],[25,"Vice-Presidente Executivo"],[28,"Presidente"]];

const TABS = [["ficha","Ficha"],["eq","Equilíbrio"],["hab","Habilidades"],["req","Requisições"],["rel","Relacionamentos"],["med","Medidores"],["bv","Boas-vindas"]];

const BV_PERGUNTAS = [
  ["q1","Como o senhor entrou em contato com sua Anomalia?"],
  ["q2","Como a Agência encontrou o senhor?"],
  ["q3","Os poderes do senhor têm alguma manifestação visual única?"],
  ["q4","Como o senhor toma café?"],
  ["q5","Descreva a experiência profissional anterior do senhor."],
  ["q6","Qual é o nível de familiaridade do senhor com Adobe, Excel e Google Suite?"],
  ["q7","Que contribuição o senhor traz para um ambiente de trabalho colaborativo?"]
];

/* ============ Modelo de dados ============ */
const F = {
  habilidades: () => ({nome:"",gatilho:"",qualidade:"",sucesso:"",falha:"",especial:"",p:"",pagina:"",praticada:false,
    r:[{t:"",m:0,n:""},{t:"",m:0,n:""}]}),
  requisicoes: () => ({nome:"",codigo:"",efeito:""}),
  relacionamentos: () => ({nome:"",interprete:"",descricao:"",conexao:0,bonus:"",ativo:false})
};
const MIN = {habilidades:3, requisicoes:6, relacionamentos:6};
const mk = n => ({nome:"",max:n,valor:0,n});
const rep = (n, fn) => Array.from({length:n}, fn);

function novo() {
  const bv = {obs:"",salario:"",emergencia:"",emergRel:"",foto:""};
  BV_PERGUNTAS.forEach(([k]) => bv[k] = "");
  return {
    versao: 1,
    basico: {nome:"",pronomes:"",cargo:"",reputacao:""},
    arc: {anomalia:"",realidade:"",competencia:""},
    cont: {meritos:0,demeritos:0,burnout:0},
    txt: {gatilho:"",alivio:"",diretriz:"",comp:["","",""]},
    garantias: QUALIDADES.map(() => ({valor:0,max:0})),
    eq: {mvp:0,probatorio:0,competencia:0,realidade:0,anomalia:0},
    habilidades: rep(MIN.habilidades, F.habilidades),
    requisicoes: rep(MIN.requisicoes, F.requisicoes),
    relacionamentos: rep(MIN.relacionamentos, F.relacionamentos),
    medidores: rep(3, () => mk(15)).concat(rep(2, () => mk(30))),
    contadores: rep(4, () => ({nome:"",max:"",valor:0})),
    boasVindas: bv
  };
}

/* ============ Utilidades ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const getP = (o, p) => p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
function setP(o, p, v) {
  const ks = p.split("."), last = ks.pop();
  ks.reduce((a, k) => a[k], o)[last] = v;
}
function merge(base, d) {
  if (d == null || typeof d !== "object") return base;
  const out = Array.isArray(base) ? base.slice() : {...base};
  for (const k of Object.keys(base)) {
    const b = base[k], v = d[k];
    if (v === undefined) continue;
    if (Array.isArray(b)) out[k] = Array.isArray(v) ? v : b;
    else if (b && typeof b === "object") out[k] = merge(b, v);
    else out[k] = v;
  }
  return out;
}
function normalizar(dados) {
  const s = merge(novo(), dados);
  for (const l of Object.keys(F)) s[l] = s[l].map(it => merge(F[l](), it));
  s.medidores = s.medidores.map(m => merge(mk(15), m));
  s.contadores = s.contadores.map(c => merge({nome:"",max:"",valor:0}, c));
  s.garantias = QUALIDADES.map((_, i) => merge({valor:0,max:0}, s.garantias[i]));
  return s;
}

/* ============ Estado e persistência ============ */
let state = carregar();
let tab = "ficha";
let timer;

function carregar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalizar(JSON.parse(raw));
  } catch (e) { console.warn("Não foi possível carregar a ficha salva.", e); }
  return novo();
}
function salvar() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      $("#status").textContent = "Salvo às " + new Date().toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"});
    } catch (e) {
      $("#status").textContent = "Erro ao salvar (espaço cheio?). Exporte um JSON.";
    }
  }, 250);
}

/* ============ Helpers de HTML ============ */
const fld = (k, label, attrs = "") => `<label class="fld"><span>${label}</span><input type="text" data-k="${k}" ${attrs}></label>`;
const num = (k, label) => `<label class="fld"><span>${label}</span><input type="number" min="0" data-k="${k}"></label>`;
const area = (k, label, rows = 3) => `<label class="fld"><span>${label}</span><textarea rows="${rows}" data-k="${k}"></textarea></label>`;
const seg = (k, n, cls = "") => `<div class="seg ${cls}" data-k="${k}" data-n="${n}">` +
  rep(n, (_, i) => `<button type="button" data-i="${i + 1}" aria-label="${i + 1}"></button>`).join("") + `</div>`;
const delBtn = (lista, i) => lista && getP(state, lista).length > MIN[lista]
  ? `<button type="button" class="item-del" data-del="${lista}:${i}" title="Remover">✕</button>` : "";

function track(kind) {
  const row = (a, b, rev) => `<div class="row ${rev ? "rev" : ""}">` +
    rep(b - a + 1, (_, j) => { const i = a + j; const c = CODES[kind][i];
      return `<button type="button" class="box" data-i="${i}" aria-label="Caixa ${i}">${c ? `<small>${c}</small>` : ""}</button>`; }).join("") + `</div>`;
  return `<div class="track ${kind}" data-k="eq.${kind}" data-n="30">${row(1, 15)}${row(16, 30, true)}</div>`;
}

/* ============ Seções ============ */
function secFicha() {
  const q = QUALIDADES.map((nome, i) => `<div class="qual"><strong>${nome}</strong>
      <input type="number" min="0" max="9" data-k="garantias.${i}.max" title="Máximo">
      ${seg(`garantias.${i}.valor`, 9, "tri")}</div>`).join("");
  return `
  <div class="grid2">
    <div class="card">
      ${fld("basico.nome","Nome do Personagem")}
      ${fld("basico.pronomes","Pronomes")}
      ${fld("basico.cargo","Cargo na Agência")}
      ${fld("basico.reputacao","Reputação na Agência")}
    </div>
    <div class="card">
      <div class="arc-row a"><b>A</b>${fld("arc.anomalia","Anomalia")}</div>
      <div class="arc-row r"><b>R</b>${fld("arc.realidade","Realidade")}</div>
      <div class="arc-row c"><b>C</b>${fld("arc.competencia","Competência")}</div>
    </div>
  </div>

  <div class="counters">
    <div class="counter m"><input type="number" min="0" data-k="cont.meritos"><strong>Méritos</strong></div>
    <div class="counter d"><input type="number" min="0" data-k="cont.demeritos"><strong>Deméritos</strong></div>
    <div class="counter b"><input type="number" min="0" data-k="cont.burnout"><strong>Burnout Adicional</strong></div>
  </div>

  <div class="grid2">
    <div>
      <div class="rule r"><h3>▶ Gatilho de Realidade</h3><p class="hint">O Mestre pode ativar gastando 3 de Caos.</p>
        <textarea rows="4" data-k="txt.gatilho"></textarea></div>
      <div class="rule r"><h3>▶ Alívio de Burnout</h3><p class="hint">Marque para ver se consegue cancelar o Burnout.</p>
        <textarea rows="4" data-k="txt.alivio"></textarea></div>
      <div class="rule c"><h3>▶ Diretriz Primária</h3><p class="hint">Recebe 1 Demérito se:</p>
        <textarea rows="4" data-k="txt.diretriz"></textarea></div>
      <div class="rule c"><h3>▶ Comportamentos Sancionados</h3><p class="hint">Recebe 1 Mérito ao fazer uma destas coisas (os 3 numa só missão: 3 Méritos adicionais).</p>
        ${[0,1,2].map(i => `<input type="text" data-k="txt.comp.${i}" style="margin-bottom:.4rem" placeholder="Comportamento ${i + 1}">`).join("")}</div>
    </div>
    <div class="card c">
      <h3>Garantias de Qualidade</h3>
      <p class="hint">Campo pequeno = máximo da Qualidade. Clique nos triângulos para marcar.</p>
      <div class="qual qual-head"><span></span><span>MÁX.</span><span></span></div>
      ${q}
    </div>
  </div>`;
}

function secEq() {
  return `
  <h2>Equilíbrio entre Vida Profissional e Pessoal</h2>
  <p class="hint">Ao marcar uma caixa num medidor, risque uma no final de cada um dos outros (limite de 1 caixa por Tempo disponível após a Missão). Consulte os Documentos com Bloqueio Lúdico dos códigos marcados.</p>
  <div class="eq-top">
    <div class="counter"><strong>MVP</strong><input type="number" min="0" data-k="eq.mvp"><span class="hint">vezes que recebeu</span></div>
    <div class="counter"><strong>Regime Probatório</strong><input type="number" min="0" data-k="eq.probatorio"><span class="hint">vezes que recebeu</span></div>
  </div>
  <div class="card c" style="margin-top:1rem">
    <div class="meter-h"><h3 class="c">Competência</h3><span class="pos" id="pos-competencia"></span></div>
    ${track("competencia")}
    <p class="hint">Ao marcar uma caixa: +1 nas Garantias de Qualidade Máximas em qualquer Qualidade (até 9) e depois 3 Méritos. Com MVP da Missão: marque 1 caixa aqui sem riscar as dos outros medidores.</p>
  </div>
  <div class="card r">
    <div class="meter-h"><h3 class="r">Realidade</h3><span class="pos" id="pos-realidade"></span></div>
    ${track("realidade")}
    <p class="hint">Ao marcar uma caixa: +1 de Conexão em qualquer Relacionamento; repita para cada Relacionamento em Rede. Sem MVP nem Regime Probatório na Missão: +1 de Conexão em qualquer Relacionamento.</p>
  </div>
  <div class="card a">
    <div class="meter-h"><h3 class="a">Anomalia</h3><span class="pos" id="pos-anomalia"></span></div>
    ${track("anomalia")}
    <p class="hint">Ao marcar uma caixa: marque Praticada em uma Habilidade de Anomalia, ou escolha "Ser Conhecido" conforme o livro. Com Regime Probatório: marque 1 caixa aqui sem riscar as dos outros medidores.</p>
  </div>`;
}

function cardHab(h, i) {
  const quals = `<option value="">—</option>` + QUALIDADES.map(q => `<option>${q}</option>`).join("");
  return `<div class="card item a">
    <div class="item-head">
      ${fld(`habilidades.${i}.nome`,"Habilidade")}
      ${fld(`habilidades.${i}.gatilho`,"Gatilho")}
      <label class="fld" style="max-width:11rem"><span>Qualidade</span><select data-k="habilidades.${i}.qualidade">${quals}</select></label>
      ${delBtn("habilidades", i)}
    </div>
    <div class="two">
      <div>
        ${area(`habilidades.${i}.sucesso`,"✔ Em caso de sucesso,",3)}
        ${area(`habilidades.${i}.especial`,"★ Efeito especial",3)}
      </div>
      <div>
        ${area(`habilidades.${i}.falha`,"✖ Em caso de falha,",3)}
        <div class="box-soft">
          <div class="rline" style="grid-template-columns:2rem 1fr auto 5rem"><strong>P:</strong>
            <input type="text" data-k="habilidades.${i}.p">
            <label class="chk"><input type="checkbox" data-k="habilidades.${i}.praticada">Praticada?</label>
            <input type="text" data-k="habilidades.${i}.pagina" placeholder="Pág. #"></div>
          ${[0,1].map(j => `<div class="rline"><strong>R:</strong>
            <input type="text" data-k="habilidades.${i}.r.${j}.t">
            ${seg(`habilidades.${i}.r.${j}.m`, 3, "small")}
            <input type="text" data-k="habilidades.${i}.r.${j}.n"></div>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
}
const secHab = () => `<h2>Habilidades de Anomalia</h2>` +
  state.habilidades.map(cardHab).join("") + `<button type="button" class="add" data-add="habilidades">+ Adicionar habilidade</button>`;

const secReq = () => `<h2>Requisições &amp; Benefícios de Trabalho e Vida Pessoal</h2><div class="grid2">` +
  state.requisicoes.map((_, i) => `<div class="card item c">
    <div class="item-head">${fld(`requisicoes.${i}.nome`,"Nome")}${fld(`requisicoes.${i}.codigo`,"Página/Código PD","style='max-width:9rem'")}${delBtn("requisicoes", i)}</div>
    ${area(`requisicoes.${i}.efeito`,"Efeito",5)}</div>`).join("") +
  `</div><button type="button" class="add" data-add="requisicoes">+ Adicionar requisição</button>`;

const secRel = () => `<h2>Relacionamentos</h2><div class="grid2">` +
  state.relacionamentos.map((_, i) => `<div class="card item r rel">
    <div class="item-head">${fld(`relacionamentos.${i}.nome`,"Nome")}${fld(`relacionamentos.${i}.interprete`,"Interpretado por")}${delBtn("relacionamentos", i)}</div>
    ${fld(`relacionamentos.${i}.descricao`,"Descrição")}
    <span class="hint">Conexão (0–9) · clique para marcar · "Em Rede" a partir do 7</span>
    ${seg(`relacionamentos.${i}.conexao`, 9, "circ")}
    ${area(`relacionamentos.${i}.bonus`,"Bônus de Conexão",2)}
    <label class="chk"><input type="checkbox" data-k="relacionamentos.${i}.ativo">Ativo</label>
  </div>`).join("") +
  `</div><button type="button" class="add" data-add="relacionamentos">+ Adicionar relacionamento</button>`;

const secMed = () => `<h2>Medidores Personalizados</h2>
  <p class="hint">Crie medidores adicionais para o seu Agente ou sua Filial.</p>` +
  state.medidores.map((m, i) => `<div class="card meter-card"><div class="head">${fld(`medidores.${i}.nome`,"Nome")}${fld(`medidores.${i}.max`,"Máx.")}</div>
    ${seg(`medidores.${i}.valor`, m.n || 15)}</div>`).join("") +
  `<h3>Contadores</h3><div class="grid2">` +
  state.contadores.map((_, i) => `<div class="card tally">
    ${fld(`contadores.${i}.nome`,"Nome")}${fld(`contadores.${i}.max`,"Máx.")}
    <div class="ctl"><button type="button" data-act="inc" data-path="contadores.${i}.valor" data-d="-1">−</button>
      <span class="view" data-k="contadores.${i}.valor"></span>
      <button type="button" data-act="inc" data-path="contadores.${i}.valor" data-d="1">+</button></div></div>`).join("") + `</div>`;

const secBv = () => `<h2>Boas-vindas, Agente!</h2>
  <div class="grid2"><div>
    ${BV_PERGUNTAS.map(([k, p], i) => `<div class="q">${area(`boasVindas.${k}`, `<b>${i + 1}.</b> ${p}`, 3)}</div>`).join("")}
    ${area("boasVindas.obs","Observações Adicionais",3)}
  </div><div>
    <div class="card"><div class="photo"><img id="foto" alt="Foto do agente" hidden>
      <div><label class="btn">Escolher foto<input type="file" id="foto-in" accept="image/*" hidden></label>
      <button type="button" data-act="rmfoto">Remover</button></div></div>
      ${fld("basico.nome","Nome")}${fld("basico.pronomes","Pronomes")}</div>
    <div class="card c">${fld("boasVindas.emergencia","Contato de Emergência")}${fld("boasVindas.emergRel","Relacionamentos")}</div>
    <div class="card c">${fld("boasVindas.salario","Salário Anual")}</div>
  </div></div>`;

const BUILD = {ficha:secFicha, eq:secEq, hab:secHab, req:secReq, rel:secRel, med:secMed, bv:secBv};

/* ============ Renderização ============ */
function render() {
  $("#tabs").innerHTML = TABS.map(([id, nome]) => `<button type="button" data-tab="${id}" class="${id === tab ? "active" : ""}">${nome}</button>`).join("");
  $("#app").innerHTML = TABS.map(([id]) => `<section class="panel ${id === tab ? "show" : ""}" id="tab-${id}">${BUILD[id]()}</section>`).join("");
  paint();
}

function cargoPara(n) {
  if (!n) return "—";
  let c = CARGOS[0][1];
  for (const [ini, nome] of CARGOS) if (n >= ini) c = nome;
  return c;
}

function paint() {
  $$("[data-k]").forEach(el => {
    const v = getP(state, el.dataset.k);
    if (el.classList.contains("seg") || el.classList.contains("track")) {
      $$("[data-i]", el).forEach(b => b.classList.toggle("on", +b.dataset.i <= (v || 0)));
    } else if (el.classList.contains("view")) {
      el.textContent = v || 0;
    } else if (el.type === "checkbox") {
      el.checked = !!v;
    } else if (el !== document.activeElement) {
      el.value = v ?? "";
    }
  });
  const c = state.eq.competencia, r = state.eq.realidade, a = state.eq.anomalia;
  const set = (id, t) => { const e = $(id); if (e) e.textContent = t; };
  set("#pos-competencia", `${c}/30 · faixa aprox.: ${cargoPara(c)}`);
  set("#pos-realidade", `${r}/30`);
  set("#pos-anomalia", `${a}/30`);
  const foto = $("#foto");
  if (foto) { foto.hidden = !state.boasVindas.foto; if (state.boasVindas.foto) foto.src = state.boasVindas.foto; }
}

/* ============ Eventos ============ */
document.addEventListener("input", e => {
  const t = e.target, k = t.dataset && t.dataset.k;
  if (!k || t.type === "file") return;
  const v = t.type === "checkbox" ? t.checked : t.type === "number" ? (t.value === "" ? 0 : Number(t.value)) : t.value;
  setP(state, k, v);
  paint();
  salvar();
});

document.addEventListener("click", e => {
  const tabBtn = e.target.closest("[data-tab]");
  if (tabBtn) { tab = tabBtn.dataset.tab; render(); window.scrollTo(0, 0); return; }

  const box = e.target.closest("[data-i]");
  if (box) {
    const w = box.closest("[data-k]");
    const i = +box.dataset.i, cur = getP(state, w.dataset.k) || 0;
    setP(state, w.dataset.k, cur === i ? i - 1 : i);
    paint(); salvar(); return;
  }

  const inc = e.target.closest("[data-act='inc']");
  if (inc) {
    const p = inc.dataset.path;
    setP(state, p, Math.max(0, (getP(state, p) || 0) + Number(inc.dataset.d)));
    paint(); salvar(); return;
  }

  const add = e.target.closest("[data-add]");
  if (add) { const l = add.dataset.add; state[l].push(F[l]()); render(); salvar(); return; }

  const del = e.target.closest("[data-del]");
  if (del) {
    const [l, i] = del.dataset.del.split(":");
    if (confirm("Remover este item?")) { state[l].splice(+i, 1); render(); salvar(); }
    return;
  }

  if (e.target.closest("[data-act='rmfoto']")) { state.boasVindas.foto = ""; paint(); salvar(); }
});

// Foto: redimensiona para não estourar o LocalStorage
document.addEventListener("change", e => {
  if (e.target.id !== "foto-in" || !e.target.files[0]) return;
  const img = new Image(), url = URL.createObjectURL(e.target.files[0]);
  img.onload = () => {
    const max = 400, s = Math.min(1, max / Math.max(img.width, img.height));
    const cv = document.createElement("canvas");
    cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
    cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
    state.boasVindas.foto = cv.toDataURL("image/jpeg", 0.8);
    URL.revokeObjectURL(url); paint(); salvar();
  };
  img.src = url;
});

/* ============ Barra superior ============ */
$("#btn-export").addEventListener("click", () => {
  const nome = (state.basico.nome || "personagem").trim().replace(/[^\w\-]+/g, "_") || "personagem";
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nome + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("#file-import").addEventListener("change", e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || typeof d !== "object" || Array.isArray(d)) throw new Error("formato");
      if (!confirm("Importar esta ficha vai substituir a ficha atual. Continuar?")) return;
      state = normalizar(d); render(); salvar();
    } catch (err) { alert("Arquivo inválido: não parece uma ficha em JSON."); }
  };
  rd.readAsText(f);
  e.target.value = "";
});

$("#btn-print").addEventListener("click", () => window.print());

$("#btn-new").addEventListener("click", () => {
  if (confirm("Isso apaga a ficha atual. Exporte o JSON antes se quiser guardá-la. Continuar?")) {
    state = novo(); render(); salvar();
  }
});

render();
})();