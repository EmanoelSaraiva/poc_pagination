import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import { v4 as uuid } from "uuid";

let port = 8081;

let users = [];

const app = express();

app.use(express.json());
app.use(cors());

app.post("/newUser", async (request, response) => {
  const { name, email, password } = request.body;

  try {
    //Valida se todos os campos foram preenchidos
    if (!name || !email || !password) {
      return response.status(400).json({ message: "Preencha todos os campos" });
    }
    //Verifica se ja existe email cadastro igual para não permitir cadastro com dois e-mail
    const verifEmail = users.find((u) => u.email === email);
    if (verifEmail) {
      return response.status(406).json("E-mail já em uso");
    }

    const autoId = uuid();
    const passwordHashed = await bcrypt.hash(password, 10);

    //Cria um objeto com todos os dados que foram pedidos no body
    const newUser = {
      id: autoId,
      name,
      email,
      password: passwordHashed,
    };

    //Salva no users
    users.push(newUser);

    response
      .status(201)
      .json({ message: "Usuário criado com sucesso!", data: users });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: "Internal error" });
  }
});

app.get("/listUsers", async (request, response) => {
  //Define se não for informado nenhuma página sera considerado a primeira página
  const { page = 1 } = request.query;

  try {
    //Limite de itens por página
    const limit = 10;
    // Calcula quantos itens existe cadastrado
    const countUsers = users.length;
    //Define a quantidade de páginas baseado n
    //a quantidade de cadastro divido pelo limit arrendodado para cima
    //O Match.ceil() serve para arredondar para cima
    const lastPage = Math.ceil(countUsers / limit);

    //Calcula a posição atual para poder recupar os itens cadastrados
    let offset = page * limit - limit;
    //Refaz o array para mostrar ao usuario
    const userSlice = users.slice(offset, offset + limit);

    // ----------------------------------------------//
    // |No objeto pagination:                       |//
    // |path: mostra a rota que esta sendo mostrada |//
    // |page: mostra a pagina atual                 |//
    // |prevPage: calcula qual é pagina anterior    |//
    // |nextPage: calcula qual é a prómixa página   |//
    // |lastPage: mostra o total de páginas         |//
    // |totalUsers: mostra o total de cadastro      |//
    // ----------------------------------------------//

    let pagination = {
      path: "/users",
      page,
      prevPage: page - 1 >= 1 ? page - 1 : null,
      nextPage: page + 1 > lastPage ? null : page + 1,
      lastPage,
      totalUsers: countUsers,
    };
    if (users.length > 0) {
      response.status(200).json({
        sucess: true,
        message: `Usuarios retornados com sucesso `,
        data: userSlice,
        pagination,
      });
    } else {
      response.status(400).send({ message: "Lista vazia" });
    }
  } catch (error) {
    response.status(500).send({ message: "Internal error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
