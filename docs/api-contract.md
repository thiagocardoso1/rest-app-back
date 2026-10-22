# Contrato da API — rest-app-back

Fonte de verdade para o consumo pelo frontend (`../rest-app-front`).
Qualquer mudança de rota, payload, status code ou formato deve ser refletida aqui no mesmo commit.

## Base

- URL local: `http://localhost:8080`
- Sem autenticação e sem banco de dados (dados fixos em memória).
- CORS: qualquer origem (`Access-Control-Allow-Origin: *`); métodos `OPTIONS, GET, POST, PUT, PATCH, DELETE`; headers `Content-Type, Authorization`.
- Formatos aceitos no request: `application/json` e `application/x-www-form-urlencoded`.
- Datas trafegam como string no formato `dd/mm/aaaa` (não ISO 8601).

## Modelo `Post`

| Campo       | Tipo   | Observação                                  |
| ----------- | ------ | ------------------------------------------- |
| `id`        | number | Inteiro                                     |
| `title`     | string | Título do post                              |
| `imageUrl`  | string | URL absoluta da imagem                      |
| `content`   | string | Texto do post                               |
| `author`    | string | Nome do autor                               |
| `createdAt` | string | Data no formato `dd/mm/aaaa`                |

## `GET /feed/posts`

Lista os posts.

**Response `200`**

```json
{
  "posts": [
    {
      "id": 1,
      "title": "Primeiro post",
      "imageUrl": "https://picsum.photos/seed/1/640/320",
      "content": "Conteudo curto do post para visualizacao inicial da estrutura. Expanda para ver mais.",
      "author": "Thigas",
      "createdAt": "15/10/2026"
    }
  ]
}
```

## `POST /feed/post`

Cria um post.

**Request body**

| Campo     | Tipo   | Obrigatório | Observação                     |
| --------- | ------ | ----------- | ------------------------------ |
| `title`   | string | sim         | Repassado para o post criado   |
| `content` | string | sim         | Repassado para o post criado   |

```json
{
  "title": "Novo post",
  "content": "Conteúdo do novo post."
}
```

**Response `201`**

```json
{
  "message": "Post created successfully!",
  "post": {
    "id": 3,
    "title": "Novo post",
    "imageUrl": "https://picsum.photos/seed/3/640/320",
    "content": "Conteúdo do novo post.",
    "author": "Thigas",
    "createdAt": "19/10/2026"
  }
}
```

**Limitações atuais (não são garantias do contrato):**

- `id`, `imageUrl`, `author` e `createdAt` são fixos no controller.
- Não há validação: `title`/`content` ausentes geram um post com valores `undefined`.
- Não há tratamento de erro explícito; rotas inexistentes caem no 404 padrão do Express.
