
var field; // Playing field
var difficulty;
var height;
var width;
var mines;
var cells_to_open;
var generated_with_clicked = false; // When the field is clicked, a new field is generated where there is never a mine where the user clicked
var startTime;
var timer;
var flags;

var difficulties = {
    beginner: {
        width: 8,
        height: 8,
        mines: 10
    },
    intermediate: {
        width: 16,
        height: 16,
        mines: 40
    },
    expert: {
        width: 30,
        height: 16,
        mines: 99
    }
};

var highscores;
var getHighscores = new XMLHttpRequest();
getHighscores.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        highscores = JSON.parse(this.responseText);
    }
}
getHighscores.open("GET", "highscores.json", true);
getHighscores.send();

function getQueryVaraible(variable) {
    // Helper function to query url
    var query =window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) return pair[1];
    }
    return false;
}

function updateCounters(counter, value) {
    // Helper function to update a counter (timer/flags)
    var digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    document.getElementById(counter + "_ones").src = `assets/${digits[value%10]}.png`
    document.getElementById(counter + "_tenths").src = `assets/${digits[Math.floor(value/10)%10]}.png`
    document.getElementById(counter + "_hundreds").src = `assets/${digits[Math.floor(value/100)%10]}.png`         
}

function toggleCounters(caller) {
    // Toggles between counters
    Array.from(caller.children).forEach(child => {
        if (child.style.display == "none") child.style.display = "block";
        else if (child.style.display == "block") child.style.display = "none";
    });
}

function createField(clicked_x=-1, clicked_y=-1) {
    // Generates a new playing field
    generated_with_clicked = !(clicked_x == -1 && clicked_y == -1);

    // Reset counters
    for (let digit of document.getElementsByClassName('digit'))
        digit.src = 'assets/zero.png';
    
    // Get difficulty
    if(difficulty = getQueryVaraible('difficulty')) {
        width = difficulties[difficulty].width;
        height = difficulties[difficulty].height;
        mines = difficulties[difficulty].mines;
    } else { // or get custom field properties
        width = getQueryVaraible('width');
        height = getQueryVaraible('height');
        mines = getQueryVaraible('mines');
    }
    
    // Can't have too many mines
    if (mines >= width * height) {
        throw "Too many mines!";
    }

    // Update the custom field dialogue with the new values
    document.getElementsByName("width")[0].defaultValue = width;
    document.getElementsByName("height")[0].defaultValue = height;
    document.getElementsByName("mines")[0].defaultValue = mines;

    // Track the number of cells that need to be opened in order to win the game.
    cells_to_open = width * height - mines;
    flags = mines;
    updateCounters("flag", flags);            

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
        let x = Math.floor(Math.random() * width);
        let y = Math.floor(Math.random() * height);
        if (x == clicked_x && y == clicked_y) continue;
        if (field[y][x] == "none") {
            field[y][x] = "mine";
            mines--;
        }
    } while (mines > 0);

    // Calculate Numbers
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (field[y][x] == "none") {
                var count = 0;
                for (let dx = -1; dx <= 1; dx++) {
                    if (x + dx < 0 || x + dx >= width) continue; 
                    for (let dy = -1; dy <= 1; dy++) {
                        if (y + dy < 0 || y + dy >= height) continue;
                        if (field[y+dy][x+dx] == "mine") count++;
                    }
                }
                if (count) field[y][x] = count;
            }
        }
    }

    // Create table
    var tableStr = "";
    for (let y = 0; y < height; y++) {
        tableStr += "<tr>\n";
        for (let x = 0; x < width; x++) {
            var cell = field[y][x];
            switch(cell) {
                case "mine":
                    tableStr += `  <td id="_${y}_${x}" class="mine hoverable" onClick="revealCell(${y}, ${x})" oncontextmenu="return placeFlag(this);">
                    <img class="flag_img" src="assets/flag.png" alt="F" width=19 height=19>
                    <img class="mine_img" src="assets/mine.png" alt="M" width=20 height=20>
                    </td>\n`;
                    break;
                case "none":
                    tableStr += `  <td id="_${y}_${x}" class="none hoverable" onClick="revealCell(${y}, ${x})" oncontextmenu="return placeFlag(this);">
                    <img class="flag_img" src="assets/flag.png" alt="F" width=19 height=19>
                    <p></p>
                    </td>\n`;
                    break;
                default:
                    tableStr += `  <td id="_${y}_${x}" class="_${cell} hoverable" onClick="revealCell(${y}, ${x})" oncontextmenu="return placeFlag(this);">
                    <img class="flag_img" src="assets/flag.png" alt="F" width=19 height=19>
                    <p>${cell}</p>
                    </td>\n`;
            }   
        }
        tableStr += "</tr>\n";
    }
    
    document.getElementById("field").innerHTML = tableStr;

    // Start the timer
    if (generated_with_clicked) {
        startTime = new Date();
        timer = setInterval(() => {
            var secs = Math.floor(new Date(new Date() - startTime)/1000);
            updateCounters("timer", secs);
            if (secs >= 999) clearInterval(timer);
        }, 1000);
    }

}

function revealCell(y, x) {
    // Reveals a cell on position (x, y)

    if (document.getElementById(`_${y}_${x}`).classList.contains("flagged")) return;  // Can't click open a flagged cell.

    // Generates new field where the clicked position is no mine.
    if (!generated_with_clicked) createField(x, y);

    if (document.getElementById(`_${y}_${x}`).classList.contains("clicked")) return;  // Check if cell is already revealed
    document.getElementById(`_${y}_${x}`).classList.add("clicked");  // Reveal first to prevent infinite looping
    // Toggle hoverability of a cell
    if (document.getElementById(`_${y}_${x}`).classList.contains("hoverable")) document.getElementById(`_${y}_${x}`).classList.remove("hoverable");
    
    // Check the value of the cell
    cell = field[y][x];
    switch(cell) {
        case "none":  // Reveal all neighbouring cells, no mines
            for (let dx = -1; dx <= 1; dx++) {
                if (x + dx < 0 || x + dx >= width) continue;
                for (let dy = -1; dy <= 1; dy++) {
                    if (y + dy < 0 || y + dy >= height) continue;
                    if (dx != 0 || dy != 0) revealCell(y + dy, x + dx);
                }
            }
            break;
        case "mine": // Mine: Game Over
            clearInterval(timer);
            Array.from(document.getElementsByTagName("td")).forEach(elem => {
                if (elem.classList.contains("mine") && !elem.classList.contains("clicked") && !elem.classList.contains("flagged"))
                    elem.classList.add("clicked");
                if (elem.classList.contains("flagged") && !elem.classList.contains("mine")) {
                    elem.getElementsByClassName("flag_img")[0].src = "assets/no_mine.png";
                }
                elem.onclick=null;
                elem.oncontextmenu="return false;";
                if (elem.classList.contains("hoverable")) elem.classList.remove("hoverable");
            });
            document.getElementById(`_${y}_${x}`).style.backgroundColor = "red";
            setTimeout(() => alert("Game Over"), 10); // Alert after the page is redrawn (hopefully).
            return;
    }

    if (!--cells_to_open) {  // If all cells are opened: win!
        clearInterval(timer);
        // Get the elapsed time of the game
        var stopTime = new Date();
        var elapsed_time = stopTime - startTime
        console.log(elapsed_time + " " + (elapsed_time < 999));
        setTimeout(() => {
            if (difficulty && elapsed_time < highscores[difficulty].score) {
                var name = prompt("Victory!\nNew Highscore: " + elapsed_time/1000 + " seconds.\nPlease enter your name: ", "");
                if (name == null || name == "") return;
                highscores[difficulty].name = name;
                highscores[difficulty].score = elapsed_time;
                var updateHighscores = new XMLHttpRequest();
                updateHighscores.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        highscores = JSON.parse(this.responseText);
                    }
                }
                updateHighscores.open("POST", "highscores.json", true);
                updateHighscores.send(JSON.stringify(highscores));

            } else {
                alert("Victory!\nScore: " + elapsed_time/1000 + " seconds");
            }
        }, 10);
        Array.from(document.getElementsByTagName("td")).forEach(elem => {
            if (elem.classList.contains("mine") && !elem.classList.contains("flagged")) 
                elem.classList.add("flagged");
            if (elem.classList.contains("hoverable")) elem.classList.remove("hoverable");
                elem.oncontextmenu="return false;";
            });
        updateCounters("flag", flags=0);
    }
}

function placeFlag(caller) {
    // Toggle a flag on the rightclicked cell
    if (caller.classList.contains("clicked")) return; // Can't flag a clicked cell.
    if (caller.classList.contains("flagged")) {
        caller.classList.remove("flagged");
        if (!caller.classList.contains("hoverable")) caller.classList.add("hoverable");
        flags++;
    } else {
        caller.classList.add("flagged");
        if (caller.classList.contains("hoverable")) caller.classList.remove("hoverable");
        flags--;
    }
    updateCounters("flag", flags);
    return false; // Don't display context menu
}


function displayMenu(caller) {
    // Toggle the context menu
    caller.classList.toggle("change");
    document.getElementById("dropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = this.document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show'))
                openDropdown.classList.remove('show');
        }
        var dropbtns = this.document.getElementsByClassName("dropbtn");
        for (i = 0; i < dropbtns.length; i++) {
            var openDropbtn = dropbtns[i];
            if (openDropbtn.classList.contains('change'))
                openDropbtn.classList.remove('change');
        }
    }
}

function customDialogue() {
    // Show the custom field dialogue
    document.getElementById("customDialogue").style.display = "block";
}

function closeCustomDialogue() {
    // Close the custom field dialogue
    document.getElementById("customDialogue").style.display = "none";
}

/* TODO: 
    - add highscores (serverside? php, nodeJS)
*/
