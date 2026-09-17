# Usa una imagen de Node ligera
FROM node:24.13.0-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install

# Copiar el resto del código (asumiendo que moviste todo a src)
COPY . .

# Exponer el puerto
EXPOSE 3006

# Comando para iniciar en desarrollo
CMD ["pnpm", "run", "dev"]