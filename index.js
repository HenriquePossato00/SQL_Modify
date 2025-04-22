const useJoin = document.getElementById("use-join"); //busca a informação no html se o join está ativo ou não
const joinOptions = document.getElementById("join-options"); // busca a informação no html para qual join será usado
const joinsContainer = document.getElementById("joins-container"); // busca a informação no html para saber se há mais joins

// Metodo para Criar ou não um novo bloco dentro do html
useJoin.addEventListener("change", () => {
  joinOptions.style.display = useJoin.value === "sim" ? "block" : "none"; // se o join for sim, mostra o bloco de joins, se não, esconde
  joinsContainer.innerHTML = ""; // limpa o container de joins
  if (useJoin.value === "sim") {
    addJoinGroup();
  }
});

// Adiciona um bloco novo de joins ao clicar no botão
function addJoinGroup() {
  const joinGroup = document.createElement("div");
  joinGroup.className = "join-group block";

  joinGroup.innerHTML = `
    <label>Nome da tabela para JOIN:</label>
    <input type="text" class="join-table" placeholder="ex: pedidos" />

    <label>Tipo de JOIN:</label>
    <select class="join-type">
      <option value="INNER">INNER JOIN</option>
      <option value="LEFT">LEFT JOIN</option>
      <option value="RIGHT">RIGHT JOIN</option>
    </select>

    <label>Lógica do JOIN (ex: usuarios.id = pedidos.usuario_id):</label>
    <input type="text" class="join-logic" placeholder="ex: usuarios.id = pedidos.usuario_id" />
  `;

  joinsContainer.appendChild(joinGroup);
}

// Método para montar o json e querry SQL
function montarBody() {
  const method = document.getElementById("method").value;
  // Pega os dados para transformar em array separados por virgula e sem espacos em branco
  const columns = document.getElementById("columns").value.split(",").map(c => c.trim()).filter(Boolean);
  const mainTable = document.getElementById("main-table").value;
  const joinSelected = useJoin.value === "sim";
  const where = document.getElementById("where").value;

  // Valida se o usuario preencheu o campo de tabela principal
  if (!mainTable) {
    alert("Selecione ao menos uma tabela principal.");
    return;
  }

  // inicia a montagem do body
  const body = { table: mainTable };
  if (columns.length) body.columns = columns;

  // inicia a montagem da querry SQL
  let query = "";
  if (method === "SELECT") {
    query = `SELECT ${columns.length ? columns.join(", ") : "*"} FROM ${mainTable}`;
    if (joinSelected) {
      const joinGroups = joinsContainer.getElementsByClassName("join-group");
      // Laço para percorrer os joins e montar a querry SQL
      for (const group of joinGroups) {
        // buiscas os dados do join
        const table = group.querySelector(".join-table").value;
        const type = group.querySelector(".join-type").value;
        const logic = group.querySelector(".join-logic").value;
        if (table && type && logic) {
          // concatna a querry SQL com os dados do join
          query += ` ${type} JOIN ${table} ON ${logic}`;
          // monta o body com os dados do join
          body.joins = body.joins || [];
          body.joins.push({ type, table, on: logic });
        }
      }
    }

    // adiciona a condição WHERE se houver e seus metodos 
    if (where) {
      query += ` WHERE ${where}`;
    } else if (method === "INSERT") {
      query = `INSERT INTO ${mainTable} (${columns.join(", ")}) VALUES (...);`;
    } else if (method === "UPDATE") {
      query = `UPDATE ${mainTable} SET ${columns.join(", ")}`;
      if (where) query += ` WHERE ${where}`;
    } else if (method === "DELETE") {
      query = `DELETE FROM ${mainTable}`;
      if (where) query += ` WHERE ${where}`;
    }

    // Divide a string digitada pelo usuario em partes para montar o body
    // Exemplo: "idade > 18 AND nome ILIKE 'joao'"
    // vira => [
    //          { "field": "idade", "operator": "gt", "value": "18" },
    //          { "field": "nome", "operator": "like", "value": "joao" }
    //         ]
    if (where && method === "SELECT") {
      // separa as condições por AND
      body.filters = where.split("AND").map(cond => {
        // separa os campos, operadores e valores
        const [field, opVal] = cond.split(/(=|>|<|ILIKE)/).map(s => s.trim());

        // Traduz os operadores SQL para os nomes esperados no backend
        const operatorMap = { "=": "eq", ">": "gt", "<": "lt", "ILIKE": "like" };
        const operator = operatorMap[opVal];

        // Extrai o valor após o operador e remove aspas
        const value = cond.split(opVal)[1].trim().replace(/^['"]|['"]$/g, "");

        // Cria o objeto com os três campos que a Lambda usa
        return { field, operator, value };
      }).filter(f => f.field && f.operator);
    }

    document.getElementById("json-body").value = JSON.stringify(body, null, 2); // retorna o Body para o html
    document.getElementById("resultado").value = query; // retorna a querry SQL para o html
    return { method, body };
  }
}

// Método para enviar os dados para a Lambda
async function enviarParaLambda() {
  const metodoSQL = document.getElementById("method").value; 

  // seleciona o metodo http a partir do metodo SQL
  const metodoHTTP = {
    SELECT: "GET", // selecione
    INSERT: "POST", // inserir
    UPDATE: "PUT", // atualizar
    DELETE: "DELETE" // deletar
  }[metodoSQL];

  const { body } = montarBody(); // Chama o método para montar o Json da requisição
  if (!body) return; // se for vasio retorna nada

  // Configura os dados para a chamada 
  let url = "https://yvx7zfuuahegtb6jlx6d3fqsbq0qqyhz.lambda-url.us-east-1.on.aws/";
  const fetchOptions = {
    method: metodoHTTP,
    headers: { "Content-Type": "application/json" }
  };

  // Se o método http for GET, ele não aceitará um body, então adicionamos o Body na url 
  // Se não envia o Body com o json
  if (metodoHTTP === "GET") {
    const query = encodeURIComponent(JSON.stringify(body));
    url += `?body=${query}`;
    console.log(url);
  } else {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions); // resposta espera um retorno(200, 400, 500) da requisição da lambda
    const result = await response.json(); // tranforma resposta em json 
    document.getElementById("lambda-response").value = JSON.stringify(result, null, 2); // envia o json para o html
  } catch (err) {
    document.getElementById("lambda-response").value = `Erro: ${err.message}`;
  }
}

function alternarTema() {
  document.body.classList.toggle("dark");
}
