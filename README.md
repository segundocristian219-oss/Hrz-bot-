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

---

## 🛠️ Stack Tecnológico & Arquitectura
Diseñado para la eficiencia. El núcleo de **Kazuto Kirigay ✰** separa la lógica de negocio de la capa de datos para permitir una escalabilidad horizontal sin fricciones.

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | Entorno de ejecución v20+ (LTS) |
| **Protocolo** | ![Baileys](https://img.shields.io/badge/Baileys-FF4B4B?style=flat-square&logo=whatsapp&logoColor=white) | Multi-Device Socket Connection |
| **Database** | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white) | Persistencia y Auth en tiempo real |
| **Estructura** | ![ESM](https://img.shields.io/badge/ES_Modules-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Arquitectura modular de alta velocidad |
| **CDN/Media** | ![DixLat](https://img.shields.io/badge/Dix.lat-000000?style=flat-square&logo=fastapi&logoColor=white) | Optimización de activos y acortado |

---

## 🚀 Despliegue Estratégico

El despliegue está optimizado para entornos **headless**. Compatible con arquitecturas x64 y ARMv8.

### 📱 Terminal Emulation (Termux)
Ideal para entornos de desarrollo ágil y hosting ligero. Utiliza el binario oficial para evitar errores de compilación en librerías nativas:

<a href="https://github.com/termux/termux-app/releases/latest/download/termux-app_universal.apk">
  <img src="https://img.shields.io/badge/DESCARGAR_APK_OFICIAL-TERMUX-171717?style=for-the-badge&logo=android&logoColor=A4C639" />
</a>

#### ⚡ Setup de Inicialización
Copia y pega el siguiente bloque para configurar el entorno completo de forma automática:

<details>
<summary>🌐 Sincronización de repositorios y entorno (click ñ)</summary>
```
pkg update && pkg upgrade -y && \
pkg install git nodejs-lts ffmpeg imagemagick -y
```
**Despliegue del núcleo**
```
git clone https://github.com/eliac-d/kirito-Bot-MD
cd kirito-Bot-MD
```

**Instalación de dependencias y arranque*"
```
npm install && npm start

```

</details>

> [!NOTE]
Monitoreo de Procesos: Para despliegues en VPS, se recomienda el uso de PM2 para gestionar el ciclo de vida del proceso y asegurar el auto-reinicio ante excepciones no controladas.





