# ChatbotSI-Beta
Chatbot para la concentración de sistemas inteligentes, disponible para pruebas Beta (próximamente) en actions on google.

## Manual de uso

1. Instalar funciones de firebase
```bash
npm install -g firebase-tools
firebase init
```
2. Clonar el repositorio
```bash
git clone <URL_DEL_REPO>
```
3. Activar firebase y vincularlo al proyecto en el que está trabajando
```bash
cd ChatbotSI-Beta/
firebase use <ID_DEL_PROYECTO>
```
4. Cambiarse al directorio de funciones e instalar los módulos necesarios
```bash
cd functions/
npm install npm-modules --save-dev
npm install actions-on-google --save-dev
npm install firebase-admin --save-dev
```
5. Hacer las modificaciones pertinentes al archivo `index.js` para adecuar las funcionalidades de la aplicación
6. Publicar las modificaciones
```bash
firebase deploy
```
