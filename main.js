// Game list and simple renderer
const games = [
  {
    id: "stick-runner",
    title: "Stick Runner",
    image: "background.jpg", // background image you already have
    url: "indexx.html", // your stick runner game file
    description: "Run and jump to avoid obstacles!",
  },
  {
    id: "tic-tac-toe",
    title: "Tic Tac Toe",
    image: "zombie1.jpg", // or any image you want for this
    url: "index.html", // your tic tac toe game file
    description: "Classic Tic Tac Toe — play vs human or computer.",
  },
];

const grid = document.getElementById("gamesGrid");

// Create each game card dynamically
function createCard(game) {
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <div class="card-image">
      <img src="${game.image}" alt="${game.title}">
    </div>
    <div class="card-body">
      <h3>${game.title}</h3>
      <p>${game.description}</p>
      <button onclick="window.location.href='${game.url}'">Play</button>
    </div>
  `;
  return el;
}

// Render all game cards
games.forEach((game) => {
  grid.appendChild(createCard(game));
});
