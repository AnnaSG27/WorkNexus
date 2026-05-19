# WorkNexus - Onboarding del Proyecto

Este documento explica cómo instalar, configurar, ejecutar y trabajar en el proyecto **WorkNexus**.

## Requisitos previos

Antes de iniciar, se recomienda tener instalado:
| Herramienta | Uso |
| :--- | :--- |
| **Git** | Clonar el repositorio y manejar versiones |
| **Docker** | Ejecutar contenedores |
| **Docker Compose** | Orquestar backend y base de datos |
| **Python 3.11+** | Desarrollo local del backend |
| **Node.js 18+** | Desarrollo local del frontend |
| **npm** | Instalación de dependencias frontend |
| **PostgreSQL** | Base de datos, si se ejecuta sin Docker |

---

# Clonar repositorio

```bash
git  clone  https://github.com/AnnaSG27/WorkNexus.git
cd  WorkNexus
```
> Si el nombre local de la carpeta queda en minúscula, usar `cd worknexus`.
---

# Variables de entorno
## Backend `.env`

Crear un archivo `.env` dentro de la carpeta del backend:
```env
SECRET_KEY=
DEBUG=
ALLOWED_HOSTS=
 
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=

STRIPE_SECRET_KEY=
STRIPE_PUBLIC_KEY=

FRONTEND_URL=
SECURE_SSL_REDIRECT=
SESSION_COOKIE_SECURE=
CSRF_COOKIE_SECURE=
```
## Frontend `.env`

Crear un archivo `.env` dentro de la carpeta del frontend:
```env
VITE_API_URL_OVERRIDE=
VITE_STRIPE_PUBLIC_KEY=
```
---

# Ejecución con Docker Compose
Desde la raíz del proyecto:
```bash
docker-compose  up  --build
```
Para ejecutar en segundo plano:
```bash
docker-compose  up  -d  --build
```
Para detener los contenedores:
```bash
docker-compose  down
```
---
# Servicios disponibles
| Servicio | URL | Descripción |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:8080` | Aplicación React + Vite |
| **Backend** | `http://localhost:8000` | API REST Django |
| **Admin Django** | `http://localhost:8000/admin/` | Panel administrativo |
| **PostgreSQL** | `localhost:5432` | Base de datos PostgreSQL |
---

# Desarrollo local del Backend
Entrar a la carpeta del backend:
```bash
cd  BACKEND
```
Crear entorno virtual:
```bash
python  -m  venv  .venv
```
Activar entorno virtual:
### Windows
```bash
.\.venv\Scripts\activate
```
### Linux/macOS
```bash
source  .venv/bin/activate
```
Instalar dependencias:
```bash
pip  install  -r  requirements.txt
```
Ejecutar migraciones: 
```bash
python  manage.py  migrate
```
Crear superusuario:
```bash
python  manage.py  createsuperuser
```
Levantar servidor:
```bash
python  manage.py  runserver
```
---
# Desarrollo local del Frontend
Entrar a la carpeta del frontend:
```bash
cd  FRONTEND
```
Instalar dependencias:
```bash
npm  install
```
Ejecutar entorno de desarrollo:
```bash
npm  run  dev
```
---
# Migraciones
Crear migraciones después de modificar modelos:
```bash
python  manage.py  makemigrations
```
Aplicar migraciones:
```bash
python  manage.py  migrate
```
Ver estado de migraciones:
```bash
python  manage.py  showmigrations
```
---
# Rutas principales
| Ruta | Descripción |
| :--- | :--- |
| `/` | Vista principal del frontend |
| `/login` | Inicio de sesión |
| `/register` | Registro de usuarios |
| `/profile` | Gestión y manejo del perfil del usuario |
| `/services` | Marketplace de servicios |
| `/projects` | Gestión / listado de proyectos |
| `/orders` | Órdenes de trabajo |
| `/admin/` | Panel administrativo Django |
| `/api/` | Base de endpoints del backend |
---

# Convenciones del proyecto

  

## Commits
| Tipo | Uso |
| :--- | :--- |
| **`feat`** | Nueva funcionalidad |
| **`fix`** | Corrección de errores |
| **`docs`** | Cambios en documentación |
| **`style`** | Cambios visuales o de formato (sin afectar la lógica del código) |
| **`refactor`** | Mejora interna del código sin cambiar su funcionalidad |
| **`test`** | Añadir o modificar pruebas automatizadas |
| **`chore`** | Configuración del proyecto, dependencias o tareas menores |

## Backend

- Mantener apps Django separadas por responsabilidad.
- Usar serializers para entrada/salida de datos.
- No exponer claves secretas en el repositorio.
- Usar variables de entorno.
- Ejecutar migraciones después de cambios en modelos.
- Mantener lógica de negocio fuera de archivos innecesariamente acoplados.

## Frontend

- Usar componentes reutilizables.
- Mantener formularios validados.
- Centralizar llamadas al backend.
- Usar React Query para datos remotos.
- No quemar URLs ni claves directamente en componentes.

---

# Equipo

Proyecto académico desarrollado por:
- José Benjamín Vega Ramírez
- Anna Sofía Giraldo Carvajal
