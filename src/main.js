
let canvas = document.getElementById("gameArea");
let ctx = canvas.getContext("2d");
let objectId = 0;

const units = [];
const collidables = [];
let selectedUnits = [];

canvas.addEventListener('click', on_canvas_click, false);
canvas.addEventListener('contextmenu', on_canvas_rightclick, false);

class Unit {
    constructor (x, y) {
        this.id = objectId++;
        this.movementSpeed = 300;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.width = 40;
        this.height = 40;
        this.distanceTraveledX = 0;
        this.distanceTraveledY = 0;

        // stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.attack = 20;
        this.defense = 2;
        this.attackRadius = 20;
        this.effectiveAttackRadius = this.width / 2 + this.attackRadius; // note: always width === height
        this.sightRadius = 150;
        this.effectiveSightRadius = this.width / 2 + this.sightRadius;
    }
}

createUnit(100, 100);
createUnit(400, 400);


function createUnit (x, y) {
    let unit = new Unit(x, y);
    units.push(unit);
    collidables.push(unit);
}

function on_canvas_click(e) {
    const clicked = {
        width: 1,
        height: 1,
        x: e.clientX,
        y: e.clientY
    }
    let collisionFound = false;
    units.forEach(iUnit => {
        if (doesCollide(clicked, iUnit)) {
            collisionFound = true;
            let doesContain = selectedUnits.find(iSelected => (iSelected.id === iUnit.id));
            if (!doesContain) {
                selectedUnits.push(iUnit);
            }
        }
    });
    if (!collisionFound) {
        selectedUnits = [];
    }
    console.log(selectedUnits);
}

function on_canvas_rightclick(e) {
    e.preventDefault();
    selectedUnits.forEach((iUnit, idx) => {
        iUnit.targetX = e.clientX + (idx * iUnit.width + 10); // TODO put padding in variable
        iUnit.targetY = e.clientY + (idx * iUnit.height + 10);
    });
}

let last = 0;
function loopy (t) {
    // Move logic
    dt = (t - last) / 1000;
    last = t;
    units.forEach(iUnit => {
    // Movement
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
            // No sizzle dizzle dazzling
            if (Math.abs(distanceToTravelX) > Math.abs(normalizedX) * magnitude) {
                newX = iUnit.targetX;
            }
            if (Math.abs(distanceToTravelY) > Math.abs(normalizedY) * magnitude) {
                newY = iUnit.targetY;
            }
            iUnit.x = newX;
            iUnit.y = newY;

            iUnit.distanceTraveledX = distanceToTravelX;
            iUnit.distanceTraveledY = distanceToTravelY;
        }
    });

    // Collision Pass
    units.forEach(iUnit => {
        collidables.forEach(iCollidable => {
            if (iUnit != iCollidable) {
                if (doesCollide(iUnit, iCollidable)) {
                    iUnit.targetX = iUnit.x;
                    iUnit.targetY = iUnit.y;

                    iUnit.x = iUnit.x - iUnit.distanceTraveledX;
                    iUnit.y = iUnit.y - iUnit.distanceTraveledY;
                }   
            }
        });
    });

    // draw
    ctx.fillStyle = "#C5C19Cff";
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
    units.forEach(iUnit => {
        ctx.fillStyle = "#99111111";
        rect = ctx.fillRect(iUnit.x - iUnit.attackRadius, iUnit.y - iUnit.attackRadius, iUnit.effectiveAttackRadius * 2, iUnit.effectiveAttackRadius * 2);
        ctx.fillStyle = "#11991111";
        rect = ctx.fillRect(iUnit.x - iUnit.sightRadius, iUnit.y - iUnit.sightRadius, iUnit.effectiveSightRadius * 2, iUnit.effectiveSightRadius * 2);
        ctx.fillStyle = "#333333ee";
        rect = ctx.fillRect(iUnit.x, iUnit.y, iUnit.width, iUnit.height);
    });

    requestAnimationFrame(loopy);
}
requestAnimationFrame(loopy);

function doesCollide (rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y);
}