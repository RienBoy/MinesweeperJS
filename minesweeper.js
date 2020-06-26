var field;
var difficulty;
var height, width, mines;
var cells_to_open, flags;
var startTime, timer;
var generated_with_clicked = true;

var difficulties = {
  beginner: {
    width: 8,
    height: 8,
    mines: 10,
  },
  intermediate: {
    width: 16,
    height: 16,
    mines: 40,
  },
  expert: {
    width: 30,
    height: 16,
    mines: 99,
  },
};

const fetchHighscores = async () => {
  const response = await fetch("./highscores.json");
  return (data = await response.json());
};

const postHighscore = async (difficulty, name, score) => {
  highscores[difficulty].name = name;
  highscores[difficulty].score = score;
  const rawResponse = await fetch("./highscores.json", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(highscores),
  });
  return (highscores = await rawResponse.json());
};

const setHighscores = (new_highscores) => (highscores = new_highscores);

const afterRedraw = (callback) => {
  requestAnimationFrame(() => setTimeout(callback, 0));
};

function getQueryVariable(variable) {
  const query = window.location.search.substring(1).split("&");
  for (let i = 0; i < query.length; i++) {
    const pair = query[i].split("=");
    if (pair[0] == variable) return pair[1];
  }
  return false;
}

var byId = document.getElementById.bind(document);

function updateCounters(counter, value) {
  const digits = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  byId(counter + "_ones").src = `assets/counter/${digits[value % 10]}.png`;
  byId(counter + "_tenths").src = `assets/counter/${
    digits[Math.floor(value / 10) % 10]
  }.png`;
  byId(counter + "_hundreds").src = `assets/counter/${
    digits[Math.floor(value / 100) % 10]
  }.png`;
}
function toggleCounters() {
  Array.from(byId("digits").children).forEach((child) => {
    if (child.style.display == "none") child.style.display = "flex";
    else child.style.display = "none";
  });
}

function toggleMenu() {
  byId("dropdown-btn").classList.toggle("change");
  if (byId("dropdown-content").style.display == "none")
    byId("dropdown-content").style.display = "block";
  else byId("dropdown-content").style.display = "none";
}

function displayHighscores() {
  byId("highscores-dialogue").style.display = "block";
  const highscores_table = document.querySelector("#highscores-dialogue tbody");
  Array.from(highscores_table.children).forEach((row) => {
    const [diff, name, time] = Array.from(row.children);
    name.innerHTML = highscores[row.id].name;
    time.innerHTML = highscores[row.id].score;
  });
}

window.onclick = function (event) {
  if (
    !event.target.matches("#dropdown-content") &&
    !event.target.matches("#dropdown-btn")
  ) {
    if (byId("dropdown-content").style.display != "none")
      byId("dropdown-content").style.display = "none";
    if (byId("dropdown-btn").classList.contains("change"))
      byId("dropdown-btn").classList.remove("change");
  }
};

function gameOver(won) {
  Array.from(document.querySelectorAll("#field td")).forEach((elem) => {
    if (
      !won &&
      elem.classList.contains("mine") &&
      !elem.classList.contains("clicked") &&
      !elem.classList.contains("flagged")
    )
      elem.classList.add("clicked");
    if (
      !won &&
      elem.classList.contains("flagged") &&
      !elem.classList.contains("mine")
    )
      elem.getElementsByClassName("flag_img")[0].src = "assets/no_mine.png";
    if (
      won &&
      elem.classList.contains("mine") &&
      !elem.classList.contains("flagged")
    ) {
      elem.classList.add("flagged");
    }
    elem.onclick = null;
    elem.oncontextmenu = "return false";
    if (elem.classList.contains("hoverable"))
      elem.classList.remove("hoverable");
  });
  if (won) updateCounters("flags", (flags = 0));
}

function revealCell(cell) {
  if (cell.classList.contains("flagged")) return;

  if (!generated_with_clicked) cell = createField(cell.x, cell.y);

  if (cell.classList.contains("clicked")) return;

  cell.classList.add("clicked");
  cell.classList.remove("hoverable");

  value = field[cell.y][cell.x];
  switch (value) {
    case "none": // Reveal all neighbouring cells, no mines
      for (let dx = -1; dx <= 1; dx++) {
        if (cell.x + dx < 0 || cell.x + dx >= width) continue;
        for (let dy = -1; dy <= 1; dy++) {
          if (cell.y + dy < 0 || cell.y + dy >= height) continue;
          if (dx != 0 || dy != 0)
            revealCell(
              document.querySelector(`#_${cell.y + dy}_${cell.x + dx}`)
            );
        }
      }
      break;
    case "mine": // Mine: Game Over
      clearInterval(timer);
      gameOver(false);
      cell.style.backgroundColor = "red";
      afterRedraw(() => alert("Game Over")); // Alert after page is redrawn
      return;
  }

  if (!--cells_to_open) {
    // If all cells are opened: win!
    clearInterval(timer);
    // Get the elapsed time of the game
    var elapsed_time = Date.now() - startTime;

    if (difficulty && elapsed_time < highscores[difficulty].score) {
      // Hooray! New highscore
      const name = prompt(
        "Vicory!\nNew Highscore: " +
          elapsed_time / 1000 +
          " seconds\nPlease enter your name:"
      );
      if (name) {
        afterRedraw(() =>
          postHighscore(difficulty, name, elapsed_time).then(setHighscores)
        );
      }
    } else {
      afterRedraw(() =>
        alert("Victory!\nScore: " + elapsed_time / 1000 + " secoonds")
      );
    }

    gameOver(true);
  }
}

function placeFlag(cell) {
  if (cell.classList.contains("clicked")) return;
  if (cell.classList.contains("flagged")) {
    cell.classList.remove("flagged");
    cell.classList.add("hoverable");
    updateCounters("flags", ++flags);
  } else {
    cell.classList.add("flagged");
    cell.classList.remove("hoverable");
    updateCounters("flags", --flags);
  }
  return false;
}

function createField(clicked_x = -1, clicked_y = -1) {
  // Get highscores
  fetchHighscores().then(setHighscores);

  // Remove previous field
  document.querySelector("#field table").innerHTML = "";

  // Clear running timer
  clearInterval(timer);

  // Generating a new playing field
  generated_with_clicked = !(clicked_x === -1 && clicked_y === -1);

  // Get difficulty
  if ((difficulty = getQueryVariable("difficulty"))) {
    width = difficulties[difficulty].width;
    height = difficulties[difficulty].height;
    mines = difficulties[difficulty].mines;
  } else {
    // or get custom field variable
    width = getQueryVariable("width");
    height = getQueryVariable("height");
    mines = getQueryVariable("mines");
  }

  // Can't have too many mines
  if (mines >= width * height) {
    throw "Too many mines!";
  }

  // Update the custom field dialogue with new values
  document.getElementsByName("width")[0].defaultValue = width;
  document.getElementsByName("height")[0].defaultValue = height;
  document.getElementsByName("mines")[0].defaultValue = mines;

  // Track the number of cells that needs to be opened in order to win the game
  cells_to_open = width * height - mines;
  flags = mines;

  // Reset counters
  updateCounters("timer", 0);
  updateCounters("flags", flags);

  // Create field array
  field = [];
  for (let y = 0; y < height; y++) {
    field.push([]);
    for (let x = 0; x < width; x++) {
      field[y].push("none");
    }
  }

  // Add mines
  do {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    if (x === clicked_x && y === clicked_y) continue;
    if (field[y][x] === "none") {
      field[y][x] = "mine";
      mines--;
    }
  } while (mines > 0);

  // Calculate numbers
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (field[y][x] !== "none") continue;
      let count = 0;
      for (let dx = -1; dx <= 1; dx++) {
        if (x + dx < 0 || x + dx >= width) continue;
        for (let dy = -1; dy <= 1; dy++) {
          if (y + dy < 0 || y + dy >= height) continue;
          if (field[y + dy][x + dx] === "mine") count++;
        }
      }
      if (count) field[y][x] = count;
    }
  }

  // Create table
  const tableRef = document.querySelector("#field > table");
  for (let y = 0; y < height; y++) {
    const rowRef = document.createElement("tr");
    for (let x = 0; x < width; x++) {
      const cellRef = document.createElement("td");

      cellRef.id = `_${y}_${x}`;
      cellRef.x = x;
      cellRef.y = y;
      cellRef.classList.add("hoverable");
      cellRef.onclick = (event) => revealCell(cellRef);
      cellRef.oncontextmenu = (event) => {
        event.preventDefault();
        return placeFlag(cellRef);
      };

      const flagImg = document.createElement("img");
      flagImg.src = "assets/flag.png";
      flagImg.alt = "F";
      flagImg.classList.add("flag_img");
      flagImg.width = 19;
      flagImg.height = 19;
      cellRef.appendChild(flagImg);

      const cell = field[y][x];
      switch (cell) {
        case "mine":
          cellRef.classList.add("mine");
          const mineImg = document.createElement("img");
          mineImg.src = "assets/mine.png";
          mineImg.alt = "M";
          mineImg.classList.add("mine_img");
          mineImg.width = 20;
          mineImg.height = 20;
          cellRef.appendChild(mineImg);
          break;
        case "none":
          cellRef.classList.add("none");
          break;
        default:
          cellRef.classList.add(`_${cell}`);
          const p = document.createElement("p");
          p.textContent = cell;
          cellRef.appendChild(p);
      }
      rowRef.appendChild(cellRef);
    }
    tableRef.appendChild(rowRef);
  }

  // Start the timer
  if (generated_with_clicked) {
    startTime = Date.now();
    timer = setInterval(() => {
      var secs = Math.floor((Date.now() - startTime) / 1000);
      updateCounters("timer", secs);
      if (secs >= 999) clearInterval(timer);
    }, 1000);
    return byId(`_${clicked_y}_${clicked_x}`);
  }
}

if (!window.location.search) {
  window.location.search = "?difficulty=beginner";
}
createField();
