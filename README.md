<img src='https://api.dix.lat/media2/1773640122670.jpg'>

<h1 align="center">
  <strong>⧫ ᴋɪʀɪᴛᴏ - ᴋᴀᴢᴜᴛᴏ ᴋɪʀɪɢᴀʏ ♛</strong>
</h1>

<a href="https://github.com/eliac-d/kirito-Bot-MD">
<img src="https://github-readme-stats.vercel.app/api/pin/?username=eliac-d&repo=kirito-Bot-MD&theme=cobalt&show_owner=true" width="400" />
</a>


> [!IMPORTANT]
> **Arquitectura de Datos y Escalabilidad:** > Este sistema está optimizado para el uso de **MongoDB™**. Se recomienda su implementación en entornos de producción para garantizar una latencia mínima, gestión eficiente de hilos y persistencia de datos de alto rendimiento.

> [!TIP]
> **Compatibilidad Híbrida (Fallback):** > El núcleo cuenta con un sistema de detección automática. En ausencia de una instancia de MongoDB™ configurada en las variables de entorno, el bot activará **LocalDB** de forma transparente, permitiendo un despliegue inmediato sin configuraciones externas.

> [!WARNING]
> **Restricciones de Rendimiento Local:** > Al operar bajo una base de datos local, el servidor puede experimentar cuellos de botella (I/O Wait) y retrasos marginales en la respuesta ante ráfagas masivas de eventos. Para proyectos de alta demanda, la migración a un clúster de MongoDB es mandatoria.

---

## 🛠️ Tecnologías y Stack
El sistema **Kazuto Kirigay ✰** está diseñado bajo una arquitectura de **automatización modular**, priorizando la velocidad de respuesta y la estabilidad de la conexión en entornos de alta demanda.

* **Runtime:** [Node.js](https://nodejs.org/) (v20+)
* **Base de Datos:** [Supabase](https://supabase.com/) (Gestión de usuarios y persistencia en tiempo real).
* **Librería Core:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) (Protocolo Multi-Device).
* **Arquitectura:** **ES Modules (ESM)** con sistema de **Command Map** para un ruteo de funciones de baja latencia.
* **Servicios Externos:** Integración nativa con **[dix.lat](https://dix.lat)** para optimización de media y acortamiento de enlaces.

---

## 🚀 Despliegue y Ejecución

El sistema es compatible con despliegues en **VPS (Ubuntu/Debian)**, **Vercel** (para APIs) y dispositivos móviles mediante **Termux**.

### 📱 Ejecución en Termux (Android)
Para garantizar la compatibilidad con las librerías de cifrado de WhatsApp, se recomienda usar la versión más reciente de Termux. Haz clic en el botón de abajo para descargar el APK oficial (Universal) directamente desde GitHub:

[![Descargar Termux](https://img.shields.io/badge/DESCARGAR-TERMUX_APK-222222?style=for-the-badge&logo=android&logoColor=white)](https://github.com/termux/termux-app/releases/latest/download/termux-app_universal.apk)

#### Instrucciones de Instalación Rápida:
Una vez instalado Termux, ejecuta los siguientes comandos para configurar el entorno de **Kazuto Kirigay**:

```bash
# Actualizar paquetes del sistema
pkg update && pkg upgrade -y

# Instalar dependencias esenciales
pkg install git nodejs-lts ffmpeg imagemagick -y

# Clonar el repositorio y entrar a la carpeta
git clone [URL_DE_TU_REPOSITORIO]
cd [NOMBRE_CARPETA]

# Instalar módulos de Node.js
npm install

# Iniciar el sistema
npm start

```

> [!TIP]
> Si planeas colaborar o necesitas ayuda técnica, revisa la sección de Issues o únete a nuestro canal oficial en [WHATSAPP](dix.lat/channel).




