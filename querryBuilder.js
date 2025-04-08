const useJoin = document.getElementById("use-join");
const joinOptions = document.getElementById("join-options");
const joinsContainer = document.getElementById("joins-container");

useJoin.addEventListener("change", () => {
  joinOptions.style.display = useJoin.value === "sim" ? "block" : "none";
  joinsContainer.innerHTML = "";
  if (useJoin.value === "sim") {
    addJoinGroup();
  }
});

function addJoinGroup() {
  const joinGroup = document.createElement("div");
  joinGroup.className = "join-group block";

  joinGroup.innerHTML = `
    <label>Nome da tabela para JOIN:</label>
    <input type="text" class="join-table" placeholder="ex: pedidos" />

    <label>Tipo de JOIN:</label>
    <select class="join-type">
      <option value="INNER JOIN">INNER JOIN</option>
      <option value="LEFT JOIN">LEFT JOIN</option>
      <option value="RIGHT JOIN">RIGHT JOIN</option>
    </select>

    <label>Lógica do JOIN (ex: usuarios.id = pedidos.usuario_id):</label>
    <input type="text" class="join-logic" placeholder="ex: usuarios.id = pedidos.usuario_id" />
  `;

  joinsContainer.appendChild(joinGroup);
}

function montarQuery() {
  const method = document.getElementById("method").value;
  const columns = document.getElementById("columns").value;
  const mainTable = document.getElementById("main-table").value;
  const joinSelected = useJoin.value === "sim";
  const where = document.getElementById("where").value;

  if (!mainTable) {
    alert("Selecione ao menos uma tabela principal.");
    return;
  }

  let query = "";

  if (method === "SELECT") {
    query = `SELECT ${columns || '*'} FROM ${mainTable}`;
    if (joinSelected) {
      const joinGroups = joinsContainer.getElementsByClassName("join-group");
      for (const group of joinGroups) {
        const table = group.querySelector(".join-table").value;
        const type = group.querySelector(".join-type").value;
        const logic = group.querySelector(".join-logic").value;
        if (table && type && logic) {
          query += ` ${type} ${table} ON ${logic}`;
        }
      }
    }
    if (where) query += ` WHERE ${where}`;
  } else if (method === "INSERT") {
    query = `INSERT INTO ${mainTable} (${columns}) VALUES (...);`;
  } else if (method === "UPDATE") {
    query = `UPDATE ${mainTable} SET ${columns}`;
    if (where) query += ` WHERE ${where}`;
  } else if (method === "DELETE") {
    query = `DELETE FROM ${mainTable}`;
    if (where) query += ` WHERE ${where}`;
  }

  document.getElementById("resultado").value = query;
}

function alternarTema() {
  document.body.classList.toggle("dark");
}
