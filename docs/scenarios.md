# ЛР2 — Ключові сценарії та зміни даних

## Сценарій 1: Створення категорії

**Запит:** `POST /categories`  
**Тіло:** `{ "name": "Food" }`

```mermaid
sequenceDiagram
  participant C as Client
  participant API as API Server
  participant S as CategoryService
  participant ST as Storage

  C->>API: POST /categories (name)
  API->>S: validate + createCategory(name)
  S->>ST: insert(Category)
  ST-->>S: created Category
  S-->>API: Category
  API-->>C: 201 Created + Category
```

**Зміна даних:** додається новий запис `Category` з унікальним `id` та `createdAt`.

---

## Сценарій 2: Отримання списку категорій

**Запит:** `GET /categories`

```mermaid
sequenceDiagram
  participant C as Client
  participant API as API Server
  participant S as CategoryService
  participant ST as Storage

  C->>API: GET /categories
  API->>S: listCategories()
  S->>ST: selectAll(Categories)
  ST-->>S: Category[]
  S-->>API: Category[]
  API-->>C: 200 OK + Category[]
```

**Агрегація:** повертається масив категорій. Додатково (за потреби в майбутньому) може бути сортування за `createdAt`.

---

## Сценарій 3: Видалення категорії

**Запит:** `DELETE /categories/:id`

```mermaid
sequenceDiagram
  participant C as Client
  participant API as API Server
  participant CS as CategoryService
  participant IS as ItemService
  participant ST as Storage

  C->>API: DELETE /categories/:id
  API->>CS: deleteCategory(id)
  CS->>IS: checkItemsExist(categoryId)
  IS->>ST: select(Item where categoryId=id)
  ST-->>IS: Item[] (може бути порожній)
  alt Є предмети
    CS-->>API: error 409 (category is used)
    API-->>C: 409 Conflict
  else Немає предметів
    CS->>ST: delete(Category by id)
    ST-->>CS: ok
    CS-->>API: ok
    API-->>C: 204 No Content
  end
```

**Зміна даних:**

- якщо немає предметів — видаляється `Category`;
- якщо предмети існують — зміни не відбуваються, повертається `409 Conflict`.

---

## Сценарій 4: Створення предмета

**Запит:** `POST /items`  
**Тіло:** `{ "name": "Bread", "quantity": 2, "categoryId": "<id>" }`

```mermaid
sequenceDiagram
  participant C as Client
  participant API as API Server
  participant IS as ItemService
  participant CS as CategoryService
  participant ST as Storage

  C->>API: POST /items (name, quantity, categoryId)
  API->>IS: validate + createItem(...)
  IS->>CS: ensureCategoryExists(categoryId)
  CS->>ST: select(Category by id)
  ST-->>CS: Category | null
  alt Категорії не існує
    IS-->>API: error 404
    API-->>C: 404 Not Found
  else Категорія існує
    IS->>ST: insert(Item)
    ST-->>IS: created Item
    IS-->>API: Item
    API-->>C: 201 Created + Item
  end
```

**Зміна даних:** додається новий `Item`.  
**Правила:** `quantity >= 0`, `categoryId` обов’язковий і має існувати.

---

## Сценарій 5: Отримання списку предметів (з фільтром)

**Запит:** `GET /items?categoryId=<id>`

```mermaid
sequenceDiagram
  participant C as Client
  participant API as API Server
  participant S as ItemService
  participant ST as Storage

  C->>API: GET /items?categoryId=...
  API->>S: listItems(filter)
  S->>ST: select(Items by filter)
  ST-->>S: Item[]
  S-->>API: Item[]
  API-->>C: 200 OK + Item[]
```

**Агрегація:** повертається масив `Item[]`.

- без `categoryId` — всі предмети;
- з `categoryId` — тільки предмети цієї категорії.

---

## Сценарій 6: Видалення предмета

**Запит:** `DELETE /items/:id`

```mermaid
sequenceDiagram
  participant C as Client
  participant API as API Server
  participant S as ItemService
  participant ST as Storage

  C->>API: DELETE /items/:id
  API->>S: deleteItem(id)
  S->>ST: delete(Item by id)
  alt Не знайдено
    S-->>API: error 404
    API-->>C: 404 Not Found
  else Видалено
    S-->>API: ok
    API-->>C: 204 No Content
  end
```

**Зміна даних:** видаляється `Item` за `id` або повертається `404`, якщо не існує.
