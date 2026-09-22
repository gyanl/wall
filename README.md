# Class Wall

A shared grid of squares for [Tech 1, Lecture 6](https://gyanl.com/tech1/lecture-6-localstorage-and-databases). Click or drag across the squares and they turn your colour on everyone's screen, straight away. It's built with plain HTML, CSS and JavaScript and Firebase Realtime Database, with no build step.

## Setup

1. In the [Firebase console](https://console.firebase.google.com), create a project and add a **Realtime Database**. Start in **test mode**.
2. Register a web app (**Project settings → General → Add app → Web**) and copy the config into `firebase-config.js`.
3. Set the database rules (**Realtime Database → Rules**). For class, anyone can read and write the wall, but only colours are accepted:

   ```json
   {
     "rules": {
       "wall": {
         ".read": true,
         "$square": {
           ".write": true,
           ".validate": "newData.isString() && newData.val().matches(/^#[0-9a-fA-F]{6}$/)"
         }
       }
     }
   }
   ```

4. Push to GitHub and turn on **Settings → Pages → Deploy from a branch → main / (root)**.

To try it locally, run any static server in this folder (for example `npx serve`). Opening `index.html` directly won't work, because browsers block module scripts from `file://`.

## The data

One colour per square, keyed by its position:

```json
{
  "wall": {
    "0": "#ff4343",
    "1": "#2b6cb0",
    "47": "#1a1a1a"
  }
}
```

## Clearing the wall

In the Firebase console, open **Realtime Database → Data**, hover over `wall` and click the delete icon.
