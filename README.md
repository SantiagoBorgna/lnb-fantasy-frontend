# Sexto Hombre Fantasy - Frontend

Este es el repositorio del frontend para **Sexto Hombre Fantasy**, una plataforma interactiva de Fantasy Basketball basada en la Liga Nacional de Básquet (LNB).

## 🚀 Tecnologías

El proyecto está construido con herramientas modernas para asegurar un rendimiento óptimo y una experiencia de usuario fluida:

- **React + Vite**: Para una carga ultrarrápida y un desarrollo ágil.
- **Tailwind CSS**: Framework de utilidades para un diseño moderno, responsive y altamente personalizable.
- **Zustand**: Manejo de estados globales de forma simple y rápida (autenticación, modales, etc.).
- **React Router**: Para el manejo de rutas y navegación en la aplicación.
- **PWA (Progressive Web App)**: Preparado para ser instalado como una aplicación nativa en dispositivos móviles.

## 📦 Estructura del Proyecto

- `/src/api`: Funciones para comunicarse con el backend (Axios).
- `/src/components`: Componentes reutilizables de la interfaz de usuario (modales, botones, navegación).
- `/src/pages`: Las vistas principales de la aplicación (Dashboard, Canchita, Mercado, etc.).
- `/src/store`: Manejadores de estado global usando Zustand.
- `/src/hooks`: Custom hooks de React para encapsular lógica compleja.

## 🛠️ Instalación y Uso Local

1. Clonar el repositorio.
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Crear un archivo `.env` en la raíz del proyecto usando como base las variables necesarias (URL del backend, claves públicas VAPID, etc.).
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🌐 Despliegue

Este proyecto está configurado para ser desplegado fácilmente en **Vercel**. Recordá configurar las variables de entorno (`VITE_API_URL`, `VITE_VAPID_PUBLIC_KEY`, etc.) en el panel de Vercel antes de desplegar.
