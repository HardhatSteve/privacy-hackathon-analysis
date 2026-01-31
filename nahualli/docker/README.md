# Arcium Development Environment (Docker)

Este setup permite correr Arcium en Intel Mac usando Docker con Linux.

## Uso

### 1. Construir la imagen (primera vez, ~10-15 min)
```bash
cd docker
docker-compose -f docker-compose.arcium.yml build
```

### 2. Iniciar el contenedor
```bash
docker-compose -f docker-compose.arcium.yml up -d
```

### 3. Entrar al contenedor
```bash
docker exec -it nahualli-arcium bash
```

### 4. Dentro del contenedor, verificar instalación
```bash
arcium --version
solana --version
anchor --version
```

### 5. Trabajar con Arcium
```bash
# Crear nuevo proyecto Arcium
arcium init my-confidential-app

# O trabajar con el proyecto existente en /app
cd /app
```

## Comandos útiles

```bash
# Ver logs
docker-compose -f docker-compose.arcium.yml logs -f

# Detener
docker-compose -f docker-compose.arcium.yml down

# Reconstruir (si hay cambios)
docker-compose -f docker-compose.arcium.yml build --no-cache
```

## Notas

- El directorio del proyecto está montado en `/app`
- Los cambios en `/app` se reflejan en tu Mac
- La configuración de Solana persiste entre reinicios
