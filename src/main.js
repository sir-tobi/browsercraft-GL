
var canvas = document.getElementById("gameArea");
var ctx = canvas.getContext("2d");

const units = [];
canvas.addEventListener('click', on_canvas_click, false);

class Unit {
    constructor () {
        this.movementSpeed = 300;
        this.x = 10;
        this.y = 10;
        this.targetX = 100;
        this.targetY = 100;
        this.width = 40;
        this.height = 40;
    }
}

createUnit();
function createUnit () {
    let unit = new Unit();
    units.push(unit);
}

function on_canvas_click({clientX: x, clientY: y}) {
    units[0].targetX = x;
    units[0].targetY = y;
}

let last = 0;
function loopy (t) {
    // Move logic
    dt = (t - last) / 1000;
    last = t;
units.forEach(iUnit => {
        if (iUnit.x != iUnit.targetX && iUnit.y != iUnit.targetY) {
            let dirX = iUnit.targetX - iUnit.x;
            let dirY = iUnit.targetY - iUnit.y;
            let magnitude = Math.sqrt(dirX*dirX + dirY*dirY);
            let normalizedX = dirX / magnitude;
            let normalizedY = dirY / magnitude;
            let distanceToTravelX = normalizedX * iUnit.movementSpeed * dt;
            let distanceToTravelY = normalizedY * iUnit.movementSpeed * dt;
            let newX = iUnit.x + distanceToTravelX;
            let newY = iUnit.y + distanceToTravelY;

            if (Math.abs(distanceToTravelX) > Math.abs(normalizedX) * magnitude) {
                newX = iUnit.targetX;
            }
            if (Math.abs(distanceToTravelY) > Math.abs(normalizedY) * magnitude) {
                newY = iUnit.targetY;
            }
            console.log(newX);
            iUnit.x = newX;
            iUnit.y = newY;
        }
    });

    // draw
    ctx.fillStyle = "#C5C19C";
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#333333";
    units.forEach(iUnit => {
        rect = ctx.fillRect(iUnit.x, iUnit.y, iUnit.width, iUnit.height);
    });

    requestAnimationFrame(loopy);
}
requestAnimationFrame(loopy);
