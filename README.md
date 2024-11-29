# Programación Service

Este servicio permite gestionar las programaciones mediante un CRUD (Crear, Obtener, Modificar y Eliminar) utilizando AWS Lambda y DynamoDB.

---

## **crearProgramacion.js**

### Descripción
Este endpoint crea una nueva programación en la base de datos.

### Método HTTP
**POST**

### URL
```
/programacion
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

### Body (JSON)
```json
{
  "tenant_id": "12345",
  "fechaHora": "2024-12-01T18:00:00Z",
  "duracion": 120,
  "idioma": "Español",
  "estado": "Activo",
  "formato": "2D"
}
```

---

## **eliminarProgramacion.js**

### Descripción
Este endpoint elimina una programación específica de la base de datos.

### Método HTTP
**DELETE**

### URL
```
/programacion
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

### Body (JSON)
```json
{
  "tenant_id": "12345",
  "ordenamiento": "abcd1234-5678-90ef-ghij-klmnopqrstuv"
}
```

---

## **modificarProgramacion.js**

### Descripción
Este endpoint actualiza los datos de una programación existente.

### Método HTTP
**PUT**

### URL
```
/programacion/{tenant_id}/{ordenamiento}
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

### Body (JSON)
```json
{
  "fechaHora": "2024-12-02T20:00:00Z",
  "duracion": 150,
  "idioma": "Inglés",
  "estado": "Inactivo",
  "formato": "3D"
}
```

---

## **obtenerProgramacionById.js**

### Descripción
Este endpoint obtiene una programación específica de la base de datos.

### Método HTTP
**GET**

### URL
```
/programacion/{tenant_id}/{ordenamiento}
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

---

## **obtenerProgramaciones.js**

### Descripción
Este endpoint obtiene todas las programaciones almacenadas en la base de datos.

### Método HTTP
**GET**

### URL
```
/programaciones
```

### Headers
```json
{
  "Authorization": "Bearer <TOKEN_VALIDO>"
}
```

