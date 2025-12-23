# Game Collection — Web + Java Games 🎮

A small collection of simple browser games and a Java console game. Use `index.html` as the launcher to access each playable game.

---

## 🎮 Included Games

- **Tic Tac Toe (Web)**

  - Files: `main.html`, `script.js`, `style.css` (web version)
  - Play: open `main.html` or click **Tic Tac Toe → Play** on `index.html`
  - Features: PvP or Player vs AI, score tracking, responsive UI

- **Tic Tac Toe (Java Console)**

  - Files: `LaunchGame.java`
  - Play: compile and run (`javac LaunchGame.java` → `java LaunchGame`)

- **Stick Runner**

  - Files: `indexx.html` and associated assets (e.g., `background.jpg`)
  - Play: click **Play** on the Stick Runner card in `index.html`

- **Run to Win**

  - Files: `run.html`, `run.js`, `run.css`, `run.png`
  - Play: click **Play** on the Run to Win card in `index.html`

- **Sudoku** ✅ (new addition)
  - Files: `sudoku.html`, `sudoku.css`, `sudoku.js`
  - Play: open `sudoku.html` or click **Sudoku → Play** on `index.html`
  - Quick controls: choose **Difficulty**, **New Game**, **Hint**, **Check**, **Solve**, **Back**
  - Notes: generator + solver use backtracking; given cells are read-only; hints reveal a correct cell

---

## 🚀 How to Use

1. Open `index.html` in a modern browser to see all available games and click **Play** for the game you want.
2. Or open a specific game directly (e.g., `sudoku.html`, `main.html`, `run.html`, `indexx.html`).

## 📁 Project Files (summary)

```
GAME/
├─ index.html          # Games launcher (main page)
├─ main.html           # Tic Tac Toe (web)
├─ script.js           # Tic Tac Toe logic (web)
├─ style.css           # Tic Tac Toe styles (web)
├─ indexx.html         # Stick Runner
├─ run.html            # Run to Win game
├─ run.js              # Run to Win script
├─ run.css             # Run to Win styles
├─ sudoku.html         # Sudoku UI
├─ sudoku.js           # Sudoku logic (generator, hints)
├─ sudoku.css          # Sudoku styles
├─ LaunchGame.java     # Java Tic Tac Toe (console)
├─ main.css            # Styles for `index.html` (launcher)
├─ main.js             # Launcher script (renders cards)
├─ assets/*.jpg/.png   # Images and thumbnails (e.g., `background.jpg`, `run.png`)
└─ README.md           # This file
```

> Tip: If a file is missing or you want a new feature (timer, pencil-notes, high scores), open an issue or submit a pull request.

---

## 🔧 Implementation Notes

- The Sudoku game uses a basic backtracking generator/solver and removes a number of cells according to difficulty (Easy / Medium / Hard).
- Tic Tac Toe web uses a small AI in `script.js` and stores scores in `localStorage`.
- The Java version (`LaunchGame.java`) provides a simple console-based Tic Tac Toe experience.

---

## 🤝 Contributing

Contributions welcome — feel free to add features (timers, improved puzzle uniqueness, better AI, UI polish) and send a pull request.

## 📝 License

This repository is available under the **MIT License**.

---

Enjoy the games! 🎯
