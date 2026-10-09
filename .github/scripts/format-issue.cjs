const START = "<!-- issue-format:start -->";
const END = "<!-- issue-format:end -->";
const ORIGINAL_START = "<!-- original:start -->";
const ORIGINAL_END = "<!-- original:end -->";

const TYPE_RULES = [
  { label: "bug", regex: /\b(bug|error|falla|fallo|no funciona|crash|se rompe|roto|rota)\b/i },
  { label: "enhancement", regex: /\b(mejora|agregar|a[ñn]adir|feature|nuev[oa]|idea|implementar|sugerencia)\b/i },
  { label: "documentation", regex: /\b(doc|documentaci[óo]n|readme|explicar)\b/i },
  { label: "question", regex: /\b(duda|pregunta|question|consulta|c[óo]mo)\b/i },
];

const AREA_RULES = [
  { label: "game-logic", regex: /\b(juego|l[óo]gica|loop|update|framerate|fps|velocidad|puntaje|score|nivel|level)\b/i },
  { label: "ui", regex: /\b(ui|interfaz|hud|pantalla|men[úu]|texto)\b/i },
  { label: "audio", regex: /\b(sonido|audio|m[úu]sica)\b/i },
  { label: "powerups", regex: /\b(power.?up|escudo|shield|disparo|triple|invulnerab|vida|salud)\b/i },
  { label: "collision", regex: /\b(colisi[óo]n|choque|impacto)\b/i },
  { label: "rendering", regex: /\b(render|dibujo|canvas|gr[áa]fico|visual|skin)\b/i },
];

const LABEL_COLORS = {
  bug: "d73a4a",
  enhancement: "a2eeef",
  documentation: "0075ca",
  question: "d876e3",
  "needs-triage": "fbca04",
  "game-logic": "1d76db",
  ui: "5319e7",
  audio: "c2e0c6",
  powerups: "f9d0c4",
  collision: "e99695",
  rendering: "bfd4f2",
};

function matchLabels(text, rules) {
  return rules.filter((rule) => rule.regex.test(text)).map((rule) => rule.label);
}

function classify(issue) {
  const text = `${issue.title}\n${issue.body ?? ""}`;
  const types = matchLabels(text, TYPE_RULES);
  const areas = matchLabels(text, AREA_RULES);
  const labels = [...types, ...areas];
  if (labels.length === 0) labels.push("needs-triage");
  return { types, areas, labels };
}

function buildBody(original, types, areas) {
  const typeLine = types.length ? types.join(", ") : "sin determinar";
  const areaLine = areas.length ? areas.join(", ") : "sin determinar";
  return [
    START,
    `**Tipo:** ${typeLine} · **Área:** ${areaLine}`,
    "",
    "<details open>",
    "<summary>Descripción original (sin editar)</summary>",
    "",
    ORIGINAL_START,
    original,
    ORIGINAL_END,
    "",
    "</details>",
    END,
  ].join("\n");
}

async function ensureLabels(github, owner, repo, labels) {
  for (const name of labels) {
    try {
      await github.rest.issues.getLabel({ owner, repo, name });
      continue;
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    try {
      await github.rest.issues.createLabel({ owner, repo, name, color: LABEL_COLORS[name] ?? "ededed" });
    } catch (error) {
      if (error.status !== 422) throw error;
    }
  }
}

module.exports = async ({ github, context, core }) => {
  const issue = context.payload.issue;
  if (!issue) {
    core.info("Sin issue en el payload; nada que hacer.");
    return;
  }

  const original = issue.body ?? "";
  if (original.includes(START)) {
    core.info(`El issue #${issue.number} ya fue formateado; se omite.`);
    return;
  }

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const { types, areas, labels } = classify(issue);

  await ensureLabels(github, owner, repo, labels);
  await github.rest.issues.update({
    owner,
    repo,
    issue_number: issue.number,
    body: buildBody(original, types, areas),
  });
  await github.rest.issues.addLabels({ owner, repo, issue_number: issue.number, labels });

  core.info(`Issue #${issue.number} formateado. Labels: ${labels.join(", ")}`);
};
