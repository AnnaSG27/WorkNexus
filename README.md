# WorkNexus

Work Nexus es un marketplace freelance moderno construido con **React + Django REST + PostgreSQL**, diseñado para conectar clientes y freelancers mediante servicios, proyectos, pagos integrados, facturación, reseñas y gestión de órdenes.

## Descripción general
WorkNexus es una plataforma SaaS tipo marketplace enfocada en:
- Publicación de servicios freelance.
- Contratación de freelancers.
- Gestión de proyectos.
- Postulación de profesionales.
- Pagos integrados con Stripe.
- Wallet interno.
- Facturación PDF.
- Sistema de reseñas.
- Mensajería entre usuarios.

La arquitectura fue diseñada para ser **escalable, modular, contenerizada, preparada para despliegue cloud y compatible con integraciones externas**.

  

## Problema que resuelve

El sistema busca reducir la informalidad en la contratación de servicios freelance, ofreciendo trazabilidad, gestión estructurada del trabajo, pagos registrados, reputación verificable y comunicación entre cliente y profesional.

## Actores del sistema
| Actor | Responsabilidad |
| :--- | :--- |
| **Cliente** | Publica proyectos, contrata servicios, realiza pagos, gestiona órdenes y califica freelancers. |
| **Freelancer** | Publica servicios, se postula a proyectos, ejecuta trabajos, recibe pagos y califica clientes. |
| **Administrador** | Supervisa usuarios, proyectos, reseñas, pagos y actividad general del sistema. |

## Funcionalidades implementadas
| Funcionalidad | Descripción |
| :--- | :--- |
| **Autenticación** | Registro, login, perfiles y roles de usuario. |
| **Marketplace de servicios** | Publicación, búsqueda y contratación de servicios freelance. |
| **Gestión de proyectos** | Clientes publican proyectos y freelancers se postulan. |
| **Órdenes de trabajo** | Seguimiento del estado de una contratación. |
| **Pagos** | Integración con Stripe mediante `PaymentIntent`. |
| **Wallet interno** | Gestión de saldo asociado a clientes. |
| **Facturación PDF** | Generación de comprobantes asociados a pagos. |
| **Reseñas** | Calificación entre clientes y freelancers. |
| **Mensajería** | Comunicación interna entre usuarios. |
| **Conversión monetaria** | Consulta de tasa USD/COP mediante API externa. |
---

  

# Arquitectura del Sistema

## Arquitectura de despliegue
```mermaid

flowchart TD

User["Usuario<br/>Cliente / Freelancer / Admin"]

Browser["Navegador Web"]

  

subgraph Vercel["Vercel - Frontend Hosting"]

Frontend["React + Vite"]

Rewrites["Vercel Rewrites<br/>/api/* → Backend EC2"]

end

  

subgraph AWS["AWS Learner Lab"]

subgraph EC2["EC2 Ubuntu Server"]

subgraph Docker["Docker Compose"]

Backend["Contenedor Backend<br/>Django REST + Gunicorn<br/>Puerto interno 8000"]

Postgres["Contenedor PostgreSQL 15<br/>Puerto interno 5432"]

Media["Volumen media<br/>Facturas PDF / archivos"]

Volume[("Volumen persistente<br/>postgres_data")]

end

end

end

  

subgraph External["Servicios Externos"]

Stripe["Stripe API<br/>Pagos y recargas"]

Exchange["ExchangeRate API<br/>Tasa USD → COP"]

end

  

User --> Browser

Browser -->|HTTPS| Frontend

Frontend -->|requests /api/*| Rewrites

Rewrites -->|HTTP| Backend

Frontend -->|Stripe.js public key| Stripe

Backend -->|PaymentIntent / confirmación| Stripe

Backend -->|Consulta tasa de cambio| Exchange

Backend -->|ORM / SQL| Postgres

Postgres --> Volume

Backend --> Media

```

## Arquitectura por capas

```mermaid

flowchart LR

subgraph Presentacion["Capa de Presentación"]

Frontend["Frontend Web<br/>React + Vite"]

end

  

subgraph Aplicacion["Capa de Aplicación / API"]

API["API REST Django<br/>Views + URLs + Serializers"]

end

  

subgraph Dominio["Capa de Dominio / Negocio"]

Users["Gestión de Usuarios<br/>Auth, perfiles cliente/freelancer"]

Marketplace["Marketplace<br/>Servicios, proyectos y postulaciones"]

Hiring["Contrataciones<br/>Órdenes, estados y mensajería"]

Payments["Pagos y Facturación<br/>Stripe, wallet, facturas PDF"]

Reputation["Reputación<br/>Reseñas y calificaciones"]

Integrations["Integraciones externas<br/>Tasa de cambio USD/COP"]

end

  

subgraph Infra["Capa de Infraestructura"]

ORM["Django ORM"]

DB[("PostgreSQL")]

Storage[("Media Storage<br/>Facturas / archivos")]

end

  

subgraph External["Servicios Externos"]

Stripe["Stripe API"]

Exchange["ExchangeRate API"]

end

  

Frontend --> API

API --> Users

API --> Marketplace

API --> Hiring

API --> Payments

API --> Reputation

API --> Integrations

  

Users --> ORM

Marketplace --> ORM

Hiring --> ORM

Payments --> ORM

Reputation --> ORM

Integrations --> ORM

  

ORM --> DB

ORM --> Storage

Payments --> Stripe

Integrations --> Exchange

```

  

## Modelo de dominio

  

```mermaid
classDiagram
    class Conversation {
        +created_at: datetime
        +updated_at: datetime
        +save()
        +other_participant(user)
    }

    class User {
        +username: string
        +email: string
        +password: string
        +country: string
        +city: string
        +str()
    }

    class FreelancerProfile {
        +bio: text
        +date_of_birth: date
        +cv: file
        +str()
    }

    class ClientProfile {
        +enterprise_name: string
        +wallet_balance: decimal
        +bank_name: string
        +str()
    }

    class Service {
        +title: string
        +description: text
        +category: string
        +price: decimal
        +delivery_time: int
        +is_active: bool
        +str()
    }

    class Order {
        +title: string
        +description: text
        +agreed_budget: decimal
        +status: string
        +source_type: string
        +str()
    }

    class Project {
        +title: string
        +description: text
        +category: string
        +budget: decimal
        +status: string
        +deadline: date
        +clean()
        +close_project()
    }

    class Payment {
        +amount: decimal
        +currency: string
        +status: string
        +method: string
        +processor_reference: string
        +str()
    }

    class ProjectApplication {
        +proposal: text
        +proposed_budget: decimal
        +status: string
        +created_at: datetime
        +str()
    }

    class Review {
        +rating: int
        +comment: text
        +created_at: datetime
        +str()
    }

    Conversation "1" --> "1" User : "participante A"
    Conversation "1" --> "1" User : "participante B"
    User "1" --> "0..1" FreelancerProfile : "tiene"
    User "1" --> "0..1" ClientProfile : "tiene"
    FreelancerProfile "1" --> "0..*" Service : "publica"
    ClientProfile "1" --> "0..*" Project : "publica"
    FreelancerProfile "1" --> "0..*" Order : "trabaja"
    ClientProfile "1" --> "0..*" Order : "contrata"
    FreelancerProfile "1" --> "0..*" ProjectApplication : "postula"
    Project "1" --> "0..*" ProjectApplication : "recibe"
    Service "1" --> "0..1" Payment : "genera"
    Order "1" --> "0..*" Review : "recibe"
    Project "1" --> "0..1" Review : "recibe"
```
---

  

# Tecnologías utilizadas

## Frontend
| Tecnología | Uso |
| :--- | :--- |
| **React 18** | UI principal |
| **TypeScript** | Tipado estático |
| **Vite** | Bundler y entorno de desarrollo |
| **Tailwind CSS** | Estilos |
| **React Router** | Navegación SPA |
| **React Query** | Manejo de estado remoto |
| **Stripe JS** | Integración de pagos |
| **Framer Motion** | Animaciones |
| **Zod** | Validaciones |
| **React Hook Form** | Manejo de formularios | 

## Backend
| Tecnología | Uso |
| :--- | :--- |
| **Django** | Framework backend |
| **Django REST Framework** | API REST |
| **PostgreSQL** | Base de datos |
| **Gunicorn** | Servidor WSGI |
| **Stripe SDK** | Integración de pagos |
| **Psycopg2** | Driver PostgreSQL |
| **WhiteNoise** | Archivos estáticos |
| **Django CORS Headers** | Manejo CORS |
| **Python Dotenv** | Variables de entorno |
## Infraestructura
| Tecnología | Uso |
| :--- | :--- |
| **Docker** | Contenerización |
| **Docker Compose** | Orquestación |
| **AWS EC2** | Hosting backend |
| **Vercel** | Hosting frontend |
| **PostgreSQL Volume** | Persistencia de datos |
---

  

# Módulos del Backend
| Módulo | Responsabilidad | Funcionalidades |
| :--- | :--- | :--- |
| **Authentication** | Gestión de usuarios y autenticación | Registro, login, JWT/Auth, perfiles cliente/freelancer, permisos y roles |
| **Services** | Administración de servicios freelance | Crear, editar, listar, filtrar y publicar servicios |
| **Projects** | Gestión de proyectos y postulaciones | Publicación de proyectos, postulaciones, propuestas y cierre de proyectos |
| **Orders** | Gestión del flujo de trabajo | Creación de órdenes, estados de trabajo, seguimiento cliente ↔ freelancer |
| **Payments** | Procesamiento de pagos | Stripe `PaymentIntent`, confirmación de pagos, wallet interno y conversión monetaria |
| **Facturas** | Facturación y comprobantes | Generación de PDFs, historial de facturación y asociación factura ↔ pago |
| **Messaging** | Comunicación interna | Conversaciones, mensajería entre usuarios y flujo de comunicación |
| **Reviews** | Sistema de reputación | Reseñas, ratings, estadísticas y promedio de calificaciones |
---

  

# Flujo de Negocio

  

## Publicación de servicios

  

```mermaid

flowchart LR

A[Freelancer crea perfil]

B[Publica servicio]

C[El servicio aparece en marketplace]

D[Cliente contrata]

E[Se genera una orden]

  

A --> B --> C --> D --> E

```

  

## Publicación de proyectos

  

```mermaid

flowchart LR

A[Cliente crea proyecto]

B[Freelancers se postulan]

C[Cliente acepta propuesta]

D[Se genera orden]

E[Se procesa el pago]

F[Se genera factura]

G[Cliente deja reseña]

  

A --> B --> C --> D --> E --> F --> G

```

  

## Procesamiento de pagos

  

```mermaid

sequenceDiagram

participant Cliente

participant Frontend

participant Backend

participant Stripe

participant DB

  

Cliente->>Frontend: Confirmar pago

Frontend->>Backend: Solicita PaymentIntent

Backend->>Stripe: Crear PaymentIntent

Stripe-->>Backend: client_secret

Backend-->>Frontend: client_secret

Frontend->>Stripe: Confirmar tarjeta

Stripe-->>Frontend: Pago exitoso

Frontend->>Backend: Confirmación

Backend->>DB: Actualizar orden y pago

Backend->>DB: Generar factura

```

  

---

  

# Infraestructura y Despliegue

  

## Pipeline de despliegue

  

```mermaid

flowchart LR

Developer[Developer]

GitHub[GitHub Repository]

Vercel[Vercel Deployment]

EC2[AWS EC2 Instance]

Docker[Docker Compose]

Backend[Django REST API]

Frontend[React + Vite]

PostgreSQL[(PostgreSQL)]

  

Developer --> GitHub

GitHub --> Vercel

GitHub --> EC2

EC2 --> Docker

Docker --> Backend

Docker --> PostgreSQL

Vercel --> Frontend

```

  

## Flujo de ejecución en producción

  

```mermaid

flowchart LR

User[Usuario]

Browser[Navegador]

Frontend[Frontend React]

API[Django REST API]

DB[(PostgreSQL)]

Stripe[Stripe API]

Exchange[ExchangeRate API]

  

User --> Browser

Browser --> Frontend

Frontend --> API

API --> DB

API --> Stripe

API --> Exchange

```

  

## Contenedores y persistencia

  

```mermaid

flowchart TD

subgraph DockerCompose["Docker Compose"]

Backend["Backend Container<br/>Django + Gunicorn"]

Database["PostgreSQL Container"]

Media["Media Storage<br/>Facturas / archivos"]

Volume[("Persistent Volume<br/>postgres_data")]

end

  

Backend --> Database

Backend --> Media

Database --> Volume

```

  

## Estrategia de infraestructura
| Componente | Tecnología | Responsabilidad |
| :--- | :--- | :--- |
| **Frontend Hosting** | Vercel | Hosting del cliente React |
| **Backend Hosting** | AWS EC2 | Ejecución de API Django |
| **Orquestación** | Docker Compose | Gestión de contenedores |
| **Base de Datos** | PostgreSQL 15 | Persistencia de datos |
| **Persistencia** | Docker Volumes | Almacenamiento permanente |
| **Pagos** | Stripe API | Procesamiento de pagos |
| **Conversión Monetaria** | ExchangeRate API | Conversión USD/COP |
---

  

# Buenas prácticas aplicadas
- Separación por capas.
- Apps Django modulares.
- Variables de entorno en `.env`.
- Uso de Docker para consistencia.
- PostgreSQL para persistencia robusta.
- React Query para manejo eficiente de estado remoto.
- Stripe para pagos seguros.
- Arquitectura preparada para escalar.
- Aplicación de principios DRY y separación de responsabilidades.

---
# Estado del proyecto
- Arquitectura definida.
- Backend modular.
- Frontend SPA funcional.
- Integración Stripe.
- PostgreSQL + Docker.
- Facturación PDF.
- Marketplace funcional.
---

# Equipo

Proyecto académico desarrollado como plataforma SaaS de marketplace freelance por:
- José Benjamín Vega Ramírez
- Anna Sofía Giraldo Carvajal
