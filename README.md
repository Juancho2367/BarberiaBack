# Barbería - Servidor

Backend API para el sistema de gestión de citas de barbería.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **bcryptjs** - Encriptación de contraseñas

## 📋 Requisitos Previos

- Node.js >= 16.x
- MongoDB (local o MongoDB Atlas)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd server
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp env.example .env
```

4. **Editar el archivo `.env`:**
```env
# Server Configuration
PORT=4000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/barberia

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Security
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=info
```

## 🚀 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Tests
npm test
```

## 📚 API Endpoints

### 🔐 Autenticación

#### `POST /api/users/register`
Registrar un nuevo usuario.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "role": "client"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client"
  }
}
```

#### `POST /api/users/login`
Iniciar sesión.

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "_id": "user-id",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "client"
  }
}
```

### 👤 Perfil de Usuario

#### `GET /api/users/profile`
Obtener perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### `PATCH /api/users/profile`
Actualizar perfil del usuario.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "email": "juancarlos@example.com"
}
```

### 📅 Citas

#### `GET /api/appointments/available-slots`
Obtener horarios disponibles para un barbero.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
- `barberId`: ID del barbero
- `date`: Fecha (YYYY-MM-DD)

#### `GET /api/appointments/my-appointments`
Obtener citas del usuario (como cliente o barbero).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### `POST /api/appointments`
Crear una nueva cita (solo clientes).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Body:**
```json
{
  "barberId": "barber-id",
  "service": "Corte de cabello",
  "date": "2024-01-15T10:00:00.000Z",
  "duration": 30,
  "notes": "Corte clásico"
}
```

#### `PATCH /api/appointments/:id`
Actualizar una cita.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

#### `DELETE /api/appointments/:id`
Cancelar una cita.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

## 🗄️ Modelos de Datos

### Usuario
```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'client' | 'barber' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Cita
```typescript
interface Appointment {
  _id: string;
  client: User;
  barber: User;
  date: Date;
  time: string;
  service: string;
  duration: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔒 Autenticación y Autorización

### Roles de Usuario
- **client**: Puede crear y gestionar sus propias citas
- **barber**: Puede ver y gestionar citas asignadas
- **admin**: Acceso completo al sistema

### Middleware de Autenticación
```typescript
// Proteger rutas
app.use('/api/protected', auth);

// Verificar roles
app.use('/api/admin', auth, checkRole(['admin']));
```

## 🌱 Seed Data

Para poblar la base de datos con datos de ejemplo:

```bash
npm run seed
```

Esto creará:
- Usuarios de prueba (clientes, barberos, admin)
- Citas de ejemplo
- Servicios disponibles

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📦 Estructura del Proyecto

```
src/
├── controllers/     # Lógica de negocio
│   ├── userController.ts
│   └── appointmentController.ts
├── models/         # Modelos de MongoDB
│   ├── User.ts
│   └── Appointment.ts
├── routes/         # Definición de rutas
│   ├── users.ts
│   └── appointments.ts
├── middleware/     # Middleware personalizado
│   └── auth.ts
├── utils/          # Utilidades
├── types/          # Tipos TypeScript
└── index.ts        # Punto de entrada
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno
- `PORT`: Puerto del servidor (default: 4000)
- `MONGODB_URI`: URI de conexión a MongoDB
- `JWT_SECRET`: Clave secreta para JWT
- `JWT_EXPIRES_IN`: Tiempo de expiración del token
- `CORS_ORIGIN`: Origen permitido para CORS

### Scripts de Desarrollo
- `npm run dev`: Servidor de desarrollo con hot reload
- `npm run build`: Compilar TypeScript
- `npm start`: Servidor de producción

## 🚀 Despliegue

### Heroku
```bash
# Configurar variables de entorno
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Desplegar
git push heroku main
```

### Docker
```bash
# Construir imagen
docker build -t barberia-server .

# Ejecutar contenedor
docker run -p 4000:4000 barberia-server
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico, contacta a:
- Email: soporte@barberia.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/barberia/issues) 