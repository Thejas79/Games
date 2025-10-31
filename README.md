# Tic Tac Toe Game Collection

A collection of tic-tac-toe implementations featuring both a modern web-based game and a Java console version. The web version includes an intelligent AI opponent using the minimax algorithm, while the Java version provides a simple console-based experience.

## 🎮 Features

### Web Version (`index.html`, `script.js`, `style.css`)
- **Modern Web Interface**: Clean, responsive design with dark theme
- **Dual Game Modes**:
  - Player vs AI (default)
  - Player vs Player
- **Intelligent AI**: Uses minimax algorithm for optimal gameplay
- **Score Tracking**: Persistent score tracking across games using localStorage
- **Game Options**:
  - AI can start first option
  - Score reset functionality
  - Restart game button
- **Visual Enhancements**:
  - Smooth animations for moves
  - Winning line highlighting
  - Responsive design
  - Modern UI with gradients and shadows

### Java Console Version (`LaunchGame.java`)
- **Console-based Interface**: Traditional text-based gameplay
- **Object-Oriented Design**: Uses abstract classes and inheritance
- **Two Player Types**:
  - Human player with input validation
  - AI player with random moves
- **Game Logic**: Complete win detection for rows, columns, and diagonals

## 🚀 How to Play

### Web Version
1. Open `index.html` in any modern web browser
2. Choose your game mode:
   - **vs AI**: Play against the computer (default)
   - **2-Player**: Play with another person
3. Optionally enable "AI starts" if you want the computer to go first
4. Click on any empty cell to make your move
5. The game automatically detects wins, draws, and tracks scores

### Java Version
1. Compile the Java file:
   ```bash
   javac LaunchGame.java
   ```
2. Run the game:
   ```bash
   java LaunchGame
   ```
3. Enter row and column numbers (0-2) when prompted
4. The game will display the board after each move

## 🎯 Game Rules

- Players take turns placing their marks (X and O) on a 3x3 grid
- The first player to get 3 marks in a row (horizontally, vertically, or diagonally) wins
- If all 9 squares are filled without a winner, the game is a draw
- In the web version, X always goes first; O goes second

## 🧠 AI Implementation

The web version features a sophisticated AI using the **minimax algorithm**:
- **Perfect Play**: The AI will never lose; it will either win or force a draw
- **Strategic Thinking**: Considers all possible future moves
- **Optimization**: Prefers faster wins and slower losses
- **Center Preference**: Takes the center square when available for better positioning

## 🛠️ Technical Details

### Web Version Architecture
- **Frontend**: Pure HTML5, CSS3, and JavaScript (no frameworks)
- **AI Algorithm**: Minimax with alpha-beta pruning concepts
- **Data Persistence**: localStorage for score tracking
- **Responsive Design**: CSS Grid and Flexbox for layout
- **Animations**: CSS keyframes for smooth user experience

### Java Version Architecture
- **Design Pattern**: Abstract class inheritance for players
- **Game Logic**: Static methods for board operations
- **Input Validation**: Ensures moves are within bounds and on empty cells
- **AI Strategy**: Random move selection (simpler than web version)

## 📁 File Structure

```
GAME/
├── index.html          # Web game main file
├── script.js           # JavaScript game logic and AI
├── style.css           # CSS styling and animations
├── LaunchGame.java     # Java console game
└── README.md           # This documentation
```

## 🎨 Design Features

### Web Version Styling
- **Dark Theme**: Modern dark color scheme with blue accents
- **Typography**: Clean, readable fonts with proper spacing
- **Interactive Elements**: Hover effects and smooth transitions
- **Visual Feedback**: Color-coded moves (blue for X, red for O)
- **Winning Animation**: Pulsing green highlight for winning lines

## 🔧 Customization

### Web Version
- Modify CSS variables in `:root` to change colors
- Adjust AI difficulty by modifying the minimax scoring
- Add sound effects by extending the JavaScript event handlers

### Java Version
- Implement smarter AI by replacing random moves with strategy
- Add input validation for better error handling
- Extend the game to support different board sizes

## 🏆 Scoring System (Web Version)

- **Persistent Storage**: Scores are saved in browser localStorage
- **Tracking**: Wins for X, wins for O, and total draws
- **Reset Option**: Clear all scores with the "Reset Scores" button
- **Context-Aware Labels**: Shows "You/X" vs "AI/O" in PvE mode, "Player X" vs "Player O" in PvP mode

## 🎮 Game Modes Comparison

| Feature | Web Version | Java Version |
|---------|-------------|--------------|
| Interface | Modern Web UI | Console Text |
| AI Intelligence | Minimax (Perfect) | Random Moves |
| Score Tracking | ✅ Persistent | ❌ None |
| Game Modes | PvE + PvP | PvE Only |
| Visual Effects | ✅ Animations | ❌ None |
| Mobile Friendly | ✅ Responsive | ❌ Desktop Only |

## 🚀 Getting Started

### Quick Start (Web Version)
1. Download all files to a folder
2. Double-click `index.html`
3. Start playing immediately!

### Quick Start (Java Version)
1. Ensure Java is installed on your system
2. Navigate to the game folder in terminal/command prompt
3. Compile: `javac LaunchGame.java`
4. Run: `java LaunchGame`

## 🤝 Contributing

Feel free to enhance either version:
- Improve the Java AI algorithm
- Add new features to the web version
- Create additional game modes
- Enhance the visual design

## 📝 License

This project is open source and available under the MIT License.

---

**Enjoy playing Tic Tac Toe!** 🎯
