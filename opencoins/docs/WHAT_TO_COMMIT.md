# 📋 Qué Subir a GitHub vs npm

## ✅ Subir a GitHub (código fuente)

### Archivos principales:

```
✅ index.ts                    # Plugin entry point
✅ package.json                # Dependencies
✅ tsconfig.json               # TypeScript config
✅ jest.config.js              # Testing config
✅ .gitignore                  # Git exclusions
✅ .npmignore                  # npm exclusions
✅ .env.example                # Environment template
```

### Código fuente:

```
✅ src/
   ✅ config.ts                # Fee collector addresses (HARDCODED)
   ✅ evm/
      ✅ network-config.ts     # EVM networks
      ✅ token-factory.ts      # EVM deployment logic
      ✅ contracts/Token.sol   # Solidity contract
   ✅ solana/
      ✅ network-config.ts     # Solana networks
      ✅ token-factory.ts      # Solana deployment logic
   ✅ utils/
      ✅ logger.ts             # Logging utility
      ✅ validation.ts         # Input validation
      ✅ validation.test.ts    # Unit tests
```

### Documentación:

```
✅ README.md                   # Main documentation
✅ LICENSE                     # MIT License
✅ CHANGELOG.md                # Version history
✅ CONFIGURATION.md            # Setup guide
✅ DEPLOYMENT.md               # Deployment instructions
✅ QUICKSTART.md               # Quick start
✅ NPM_PUBLICATION.md          # npm publishing guide
✅ docs/
   ✅ USAGE.md                 # Usage guide
   ✅ SECURITY.md              # Security best practices
   ✅ CONTRACTS.md             # Contract documentation
   ✅ WIZARD_GUIDE.md          # Interactive wizard guide
   ✅ GUIDED_LAUNCH.md         # Launch guide
```

---

## ❌ NO Subir a GitHub (excluido en .gitignore)

### Generados automáticamente:

```
❌ node_modules/              # Dependencias (usuarios hacen npm install)
❌ dist/                      # Código compilado (usuarios hacen npm run build)
❌ package-lock.json          # Lock file (opcional, algunos lo incluyen)
❌ *.tsbuildinfo              # TypeScript build info
```

### Archivos sensibles:

```
❌ .env                       # Variables de entorno (NUNCA subir)
❌ .env.local                 # Env locales
❌ .env.*.local               # Variantes env
```

### Archivos temporales:

```
❌ *.log                      # Logs
❌ *.tmp                      # Archivos temporales
❌ *.backup                   # Backups
❌ .cache/                    # Cache
```

### IDE y OS:

```
❌ .vscode/                   # VS Code settings
❌ .idea/                     # IntelliJ settings
❌ .DS_Store                  # macOS
❌ Thumbs.db                  # Windows
```

---

## 📦 Subir a npm (paquete publicado)

El npm package INCLUYE archivos compilados:

### Lo que incluye npm:

```
✅ dist/                      # Código compilado (NECESARIO para usuarios)
✅ src/                       # Código fuente (para referencia)
✅ package.json               # Metadata
✅ README.md                  # Documentación
✅ LICENSE                    # Licencia
✅ docs/                      # Documentación
   ✅ USAGE.md
   ✅ SECURITY.md
   ✅ CONTRACTS.md
   ✅ WIZARD_GUIDE.md
```

### Excluido de npm (.npmignore):

```
❌ .git/                      # Control de versiones
❌ .gitignore                 # Archivo git
❌ .github/                   # GitHub actions
❌ *.test.ts                  # Tests
❌ .env                       # Environment
❌ DEPLOYMENT.md              # Solo para devs
❌ CONFIGURATION.md           # Solo para devs
❌ NPM_PUBLICATION.md         # Solo para devs
```

---

## 🔧 Comandos Importantes

### Inicializar Git:

```bash
git init
git add .
git commit -m "Initial commit: OpenCoins Launchpad MCP"
```

### Ver qué se subirá:

```bash
git status
```

### Ver qué incluirá npm:

```bash
npm pack --dry-run
```

### Limpiar antes de commit:

```bash
# Eliminar node_modules si accidentalmente se agregó
git rm -r --cached node_modules

# Eliminar dist si accidentalmente se agregó
git rm -r --cached dist
```

---

## ⚠️ IMPORTANTE: Archivos con Datos Sensibles

### ❌ NUNCA subir:

- `.env` - Contiene claves privadas
- Private keys sueltas
- Keypairs de Solana
- API keys
- Secrets

### ✅ SÍ subir (son seguros):

- `src/config.ts` - Direcciones públicas de wallets (no private keys)
- `.env.example` - Template sin datos reales
- Código fuente - No contiene secrets

---

## 📊 Resumen Visual

```
GitHub Repo:
├── ✅ Código fuente (src/)
├── ✅ Config (package.json, tsconfig.json)
├── ✅ Docs (README, docs/)
├── ❌ node_modules/ (gitignore)
├── ❌ dist/ (gitignore)
└── ❌ .env (gitignore)

npm Package:
├── ✅ dist/ (código compilado)
├── ✅ src/ (fuente como referencia)
├── ✅ package.json
├── ✅ README.md
├── ✅ docs/
└── ❌ archivos de desarrollo
```

---

## ✨ Estado Actual del Proyecto

**Limpio y listo:**

- ✅ `.gitignore` actualizado
- ✅ `.npmignore` actualizado
- ✅ Archivos `.backup` eliminados
- ✅ Estructura organizada
- ✅ Build exitoso

**Listo para:**

1. `git init && git add . && git commit -m "Initial commit"`
2. `git remote add origin <tu-repo>`
3. `git push -u origin main`
4. `npm publish --access public`

¡Todo limpio y listo para subir! 🚀
