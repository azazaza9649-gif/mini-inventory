# ЛР2 — Архітектура та модель даних

## Компоненти та взаємодія

```mermaid
flowchart LR
  U["Користувач / Client"] -->|HTTP запити| API["API Server (Fastify)"]
  API --> R["Роутери: /categories, /items"]
  R --> V["Валідація запитів + бізнес-правила"]
  V --> S["Сервісний шар: CategoryService / ItemService"]
  S --> ST["Сховище даних"]
  ST --> IM["In-memory Store (ЛР3)"]
  ST --> DB["База даних через Prisma (ЛР4+)"]
```

**Пояснення:**

- **API Server** приймає HTTP-запити та повертає відповіді.
- **Роутери** відповідають за маршрути `/categories` і `/items`.
- **Валідація + правила** забезпечують коректність даних (наприклад, `quantity >= 0`, категорія існує).
- **Сервіси** інкапсулюють бізнес-логіку.
- **Сховище даних** на ЛР3 — in-memory, на ЛР4 — реальна БД через Prisma.

---

## ER-модель (сутності та зв’язки)

```mermaid
erDiagram
  CATEGORY ||--o{ ITEM : "має"

  CATEGORY {
    string id PK
    string name
    datetime createdAt
  }

  ITEM {
    string id PK
    string name
    int quantity
    string categoryId FK
    datetime createdAt
  }
```

**Обмеження/інваріанти:**

- `Item.categoryId` має посилатися на існуючу `Category.id`.
- `Item.quantity` — невід’ємне число.
- Видалення категорії заборонено, якщо є хоча б один `Item` з `categoryId = Category.id`.
