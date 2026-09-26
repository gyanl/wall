# The Wall

A shared grid of squares for [Tech 1, Lecture 6](https://gyanl.com/tech1/lecture-6-localstorage-and-databases). Pick a name and a colour, then click or drag across the squares. They turn your colour on everyone's screen straight away, and a live leaderboard shows who owns the most squares. It's built with plain HTML, CSS and JavaScript and Firebase Realtime Database, with no build step.

## Setup

1. In the [Firebase console](https://console.firebase.google.com), create a project and add a **Realtime Database**. Start in **test mode**.
2. Register a web app (**Project settings → General → Add app → Web**) and copy the config into `firebase-config.js`.
3. Set the database rules (**Realtime Database → Rules**). For class, anyone can read and write the wall, but each square has to be a colour and a short name:

   ```json
   {
     "rules": {
       "wall": {
         ".read": true,
         "$square": {
           ".write": true,
           ".validate": "newData.hasChildren(['colour', 'name'])",
           "colour": { ".validate": "newData.isString() && newData.val().matches(/^#[0-9a-fA-F]{6}$/)" },
           "name": { ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 20" },
           "$other": { ".validate": false }
         }
       }
     }
   }
   ```

4. Push to GitHub and turn on **Settings → Pages → Deploy from a branch → main / (root)**.

To try it locally, run any static server in this folder (for example `npx serve`). Opening `index.html` directly won't work, because browsers block module scripts from `file://`.

## The data

One entry per square, keyed by its position, with the colour and the name of whoever painted it last:

```json
{
  "wall": {
    "0":  { "colour": "#ff4343", "name": "Upasna" },
    "1":  { "colour": "#6694ff", "name": "Shivangi" },
    "47": { "colour": "#ff4343", "name": "Upasna" }
  }
}
```

The leaderboard isn't stored anywhere. Each page counts the squares per name every time the wall changes.

Your name and colour are saved in your browser's localStorage, so you only pick them once.

## Clearing the wall

In the Firebase console, open **Realtime Database → Data**, hover over `wall` and click the delete icon.
