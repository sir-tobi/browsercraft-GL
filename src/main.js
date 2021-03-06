// List of used debug flags (adapt or append as needed)
// @Incomplete - some functionality is missing or could be added/enhanced
// @FIXME - not necessarily broken but should be changed

//// For Debugging
const DebugFlags = {
    moveOnlyAlong8CardinalDirections: {
        value: false,
        key: 'c'
    }
};
_DebugKeysToFlagNames = {};
Object.keys(DebugFlags).forEach(flag => {
    _DebugKeysToFlagNames[DebugFlags[flag].key] = flag;
});
console.log(`Initial DebugFlags\n${JSON.stringify(DebugFlags, null, 4)}`);
//// For Debugging END



const canvas = document.getElementById("gameArea");
const ctx = canvas.getContext("2d");
let nextLeftClickAction = "";
const humanPlayer = 1;
const units = [];
const collidables = [];
const selectedUnits = [];

canvas.addEventListener('click', handleLeftClick, false);
canvas.addEventListener('contextmenu', handleRightClick, false);
window.addEventListener('keydown', handleKeyDown);

function handleKeyDown(e) {
    if (Object.keys(_DebugKeysToFlagNames).includes(e.key)) {
        console.log(`DebugFlag '${_DebugKeysToFlagNames[e.key]}' is now set to: ${!DebugFlags[_DebugKeysToFlagNames[e.key]].value}`);
        DebugFlags[_DebugKeysToFlagNames[e.key]].value = !DebugFlags[_DebugKeysToFlagNames[e.key]].value;
    }
    if (e.key = "a") {
        // @FIXME
        if (nextLeftClickAction === "attackMove") {
            canvas.classList.toggle("attackMove");
            nextLeftClickAction = "";
        } else if (selectedUnits.length > 0) {
            canvas.classList.toggle("attackMove");
            nextLeftClickAction = "attackMove";
        }
    }
}


class Obj {
    constructor() {
        this.id = Obj._idCounter++;
    }
}
Obj._idCounter = 0;

class Unit extends Obj {
    constructor(x, y, owner) {
        super();
        this.owner = owner;
        this.controller = owner;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.collisionRadius = 30;
        this.selectionRadius = this.collisionRadius;
        this.width = 60;
        this.height = 60;
        this.distanceTraveledX = 0;
        this.distanceTraveledY = 0;
        this.isSelected = false;

        // stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.movementSpeed = 300;
        this.sightRadius = 180;
        this.aggroRadius = this.sightRadius;

        // sprite
        this.sprite = new Image ();
        this.sprite.src = "assets/sprites/grunt" + this.owner + ".png";
        this.spriteWidth = 73;
        this.spriteHeight = 73;
        this.animWalkingMax = 73 * 4;
        this.animAttackingStart = 73 * 4;
        this.animAttackingMax = 73 * 8;
        this.animDead = 73 * 10;
        this.direction = 0; // @FIXME - should be more descriptive if it is specifically for sprites (we may want/need to save the mathematical direction on Unit)
        this.spriteRenderWidth = 100;
        this.spriteRenderHeight = 100;

        // animation
        this.animation = 0;
        this.animPhase = 0;
        this.animFramesBetweenPhases = 9;
        this.animWalking = 0;
        this.animAttacking = 73 * 5;

        // attack
        this.attackRadius = 50;
        this.attack = 20;
        this.defense = 2;
        this.attackSpeed = 10; // per x frames
        this.attackCooldown = 20;
        this.targetUnit = null;
        this.fixedAggro = false;
        this.attackCooldownTicker = 0;
        this.attackPhase = 0;
        this.attackTarget = null;
        this.isAggro = false;
        this.isAttacking = false;
        this.isDead = false;

        // reaction
        this.reactionTime = 0; // Brainfart in frames
        this.reactionTimeCount = 0;
    }

    get collisionRect() {
        return this._getRectFromRadius(this.collisionRadius);
    }

    get sightRect() {
        return this._getRectFromRadius(this.sightRadius);
    }

    get aggroRect() {
        return this._getRectFromRadius(this.aggroRadius);
    }

    get attackRect() {
        return this._getRectFromRadius(this.attackRadius);
    }

    _getRectFromRadius(radius) {
        const x = this.x - radius;
        const y = this.y - radius;
        const sideLength = radius * 2;
        return {
            x: x,
            y: y,
            width: sideLength,
            height: sideLength,
            left: x,
            top: y,
            right: x + sideLength,
            bottom: y + sideLength,
        };
    }

    performAttack(target) {
        this.attackPhase++;
        if (this.attackPhase >= this.attackSpeed && this.attackCooldownTicker <= 0) {
            this.attackPhase = 0;
            // Show next sprite
            if (!(this.animAttacking >= this.animAttackingMax)) {
                this.animAttacking += this.spriteHeight;
            } else {
                // Reset animation after maximum of sprites is reached
                this.attackCooldownTicker = this.attackCooldown;
                this.animAttacking = this.animAttackingStart;

                // @Fixme - we probably want to call a function on the target here instead
                // since a building probably has no isAggro etc.
                target.hp -= (this.attack - target.defense);
                target.isAggro = true;
            }
        }
    }
}


// @Incomplete if we want a featurecomplete, bugfree (and cornercase respecting) vector class we should use an existing library
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // @Incomplete
    // All these function (except 'length') return a new vec2 object.
    // Maybe add flag to modify the object the method was called on instead.
    subtract(s) {
        if (typeof s === 'number') {
            return new Vec2(this.x - s, this.y - s);
        }
        return new Vec2(this.x - s.x, this.y - s.y);
    }

    multiply(m) {
        if (typeof m === 'number'){
            return new Vec2(this.x * m, this.y * m);
        }
        return new Vec2(this.x * m.x, this.y * m.y);
    }

    normalize() {
        const length = this.length();
        const x = this.x / length;
        const y = this.y / length;
        return new Vec2(x, y);
    }

    length() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
}

createUnit(100, 100, 1);
createUnit(400, 400, 1);
createUnit(700, 300, 2);


function createUnit(x, y, owner) {
    const unit = new Unit(x, y, owner);
    units.push(unit);
    collidables.push(unit);
}

function getMousePos(e) {
    const canvasRect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - canvasRect.x,
        y: e.clientY - canvasRect.y,
    };
}

function handleLeftClick(e) {
    e.preventDefault();
    const mousePos = getMousePos(e);

    if (nextLeftClickAction === "attackMove") {
        canvas.classList.toggle("attackMove");
        selectedUnits.forEach((unit, idx) => {
            nextLeftClickAction = "";
            unit.reactionTimeCount = 0;
            unit.isAggro =  true;
            unit.targetUnit = null;
            unit.fixedAggro = false;
            // @Incomplete - formation logic
            unit.targetX = mousePos.x + (idx * (unit.width + 10)); // TODO put padding in variable
            unit.targetY = mousePos.y + (idx * (unit.height + 10));
        });
    } else {
        const clickedUnit = units.find(unit => (doesPointCollideRect(mousePos, unit.collisionRect)));
        const groundClicked = !clickedUnit;
        if (groundClicked) {
            deselectUnits();
        } else {
            selectUnit(clickedUnit);
        }
    }
}

function deselectUnits() {
    selectedUnits.forEach(selectedUnit => {
        selectedUnit.isSelected = false;
    });
    selectedUnits.splice(0, selectedUnits.length); // empty the array
}

function selectUnit(unit) {
    const unitAlreadySelected = selectedUnits.find(selectedUnit => (selectedUnit.id === unit.id));
    if (unitAlreadySelected) {
        return;
    }

    if (unit.controller !== humanPlayer) {
        return;
    }

    selectedUnits.push(unit);
    unit.isSelected = true;
}

function handleRightClick(e) {
    e.preventDefault();
    const mousePos = getMousePos(e);

    // @FIXME Copy pasted from unit selection (left click)
    if (nextLeftClickAction === "attackMove") {
        canvas.classList.toggle("attackMove");
    }

    nextLeftClickAction = "";
    const clickedUnit = units.find(unit => (doesPointCollideRect(mousePos, unit.collisionRect)));
    if (clickedUnit) {
        selectedUnits.forEach(unit => {
            unit.targetUnit = clickedUnit;
            unit.reactionTimeCount = 0;
            if (unit.controller !== clickedUnit.controller) {
                unit.fixedAggro = true;
                unit.isAggro = true;
            } else {
                // @FIXME let unit follow
                unit.fixedAggro = false;
                unit.isAggro = false;
            }
        });
    } else {
        selectedUnits.forEach((unit, idx) => {
            unit.reactionTimeCount = 0;
            unit.isAttacking = false;
            unit.isAggro =  false;
            unit.fixedAggro = false;
            unit.targetUnit = null;
            // @Incomplete - formation logic
            unit.targetX = mousePos.x + (idx * (unit.width + 10)); // TODO put padding in variable
            unit.targetY = mousePos.y + (idx * (unit.height + 10));
        });
    }
}

function doesRectCollideRect(r1, r2) {
    return r1.left   < r2.right
        && r1.right  > r2.left
        && r1.top    < r2.bottom
        && r1.bottom > r2.top;
}

function doesPointCollideRect(p, r) {
    return p.x > r.left
        && p.y > r.top
        && p.x < r.right
        && p.y < r.bottom;
}


//// update functions
function updateAttacking() {
    units.forEach(unit => {
        unit.attackCooldownTicker--;
        if (!unit.isAggro) {
            return;
        }

        let enemy = null;
        let minDistance = null;
        units.forEach(targetUnit => {
            if (unit.id !== targetUnit.id) {
                // Check for target
                if (!unit.fixedAggro) {
                    if (doesRectCollideRect(unit.aggroRect, targetUnit.collisionRect)) {
                        if (unit.controller !== targetUnit.controller && !targetUnit.isDead) {
                            unit.reactionTimeCount++;
                            if (unit.reactionTimeCount >= unit.reactionTime) {
                                const vecUnit = new Vec2(unit.x, unit.y);
                                const vecTarget = new Vec2(targetUnit.x, targetUnit.y);
                                const distance = vecUnit.subtract(vecTarget);
                                if (minDistance === null) {
                                    minDistance = distance;
                                    enemy = targetUnit;
                                }
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    enemy = targetUnit;
                                }
                            }
                        }
                    }
                } else {
                    enemy = unit.targetUnit;
                }
            }
        });
        unit.targetUnit = enemy;

        if (unit.targetUnit) {
            unit.targetX = unit.targetUnit.x;
            unit.targetY = unit.targetUnit.y;

            if (doesRectCollideRect(unit.attackRect, enemy.collisionRect) && !enemy.isDead) {
                unit.isAttacking = true;
                unit.direction = getDirection({
                	x: unit.x,
                	y: unit.y
                }, {
                	x: enemy.x,
                	y: enemy.y
                }, asVector=false);
                unit.performAttack(enemy);
            } else {
                unit.isAttacking = false;
            }
        }
    });
}

function getDirection(unit, targetPoint, asVector=true) {
    // @Cleanup
    const angle = Math.atan2(targetPoint.y - unit.y, targetPoint.x - unit.x) * 180 / Math.PI;
    let direction;
    if (asVector) {
    	if (angle > -112.5 && angle < -67.6) {
        	direction = new Vec2(0, -1); // top
    	} else if (angle > -67.5 && angle < -22.6) {
        	direction = new Vec2(1, -1).normalize(); // top-right
    	} else if (angle > -22.5 && angle < 22.6) {
        	direction = new Vec2(1, 0); // right
    	} else if (angle > 22.5 && angle < 67.6) {
        	direction = new Vec2(1, 1).normalize(); // down-right
    	} else if (angle > 67.5 && angle < 112.6) {
        	direction = new Vec2(0, 1); // down
    	} else if (angle > 112.5 && angle < 157.6) {
        	direction = new Vec2(-1, 1).normalize(); // down-left
    	} else if (angle > 157.5 && angle < 180 || angle < -157.5 && angle > -180.1) {
        	direction = new Vec2(-1, 0); // left
    	} else if (angle < -112.5 && angle > -157.6) {
        	direction = new Vec2(-1, -1).normalize(); // top-left
    	}
    } else {
        if (angle > -112.5 && angle < -67.6) {
            direction = 0; // top
        } else if (angle > -67.5 && angle < -22.6) {
            direction = 1; // top-right
        } else if (angle > -22.5 && angle < 22.6) {
            direction = 2; // right
        } else if (angle > 22.5 && angle < 67.6) {
            direction = 3; // down-right
        } else if (angle > 67.5 && angle < 112.6) {
            direction = 4; // down
        } else if (angle > 112.5 && angle < 157.6) {
            direction = 5; // down-left
        } else if (angle > 157.5 && angle < 180 || angle < -157.5 && angle > -180.1) {
            direction = 6; // left
        } else if (angle < -112.5 && angle > -157.6) {
            direction = 7; // top-left
        }
    }
    return direction;
}

function updateMovement(dt) {
     // Movement
     units.forEach(unit => {
        if (unit.x != unit.targetX && unit.y != unit.targetY && !unit.isAttacking) {
            // set new position
            const target = new Vec2(unit.targetX, unit.targetY);
            const position = new Vec2(unit.x, unit.y);
            const direction = target.subtract(position);
            let directionNormalized = direction.normalize();
            if (DebugFlags.moveOnlyAlong8CardinalDirections.value) {
         		directionNormalized = getDirection({
         			x: unit.x,
         			y: unit.y
         		}, {
         			x: unit.targetX,
         			y: unit.targetY
         		});
            }

            const velocity = directionNormalized.multiply(unit.movementSpeed);
            let coveredDistance = velocity.multiply(dt);
            if (coveredDistance.length() > direction.length()) {
                // x,y of the unit + direction should be targetX,Y
                // but that may not be true due to floating point precision?
                // It at least seems not to be a problem
                coveredDistance = direction;
            }
            unit.x += coveredDistance.x;
            unit.y += coveredDistance.y;


            // Walking animation
            unit.animPhase++;
            if (unit.animPhase >= unit.animFramesBetweenPhases) {
                unit.animPhase = 0;
                unit.direction = getDirection({
                	x: unit.x,
                	y: unit.y
                }, {
                	x: unit.targetX,
                	y: unit.targetY
                }, asVector=false);
                // Show next sprite
                if (!(unit.animWalking >= unit.animWalkingMax)) {
                    unit.animWalking += unit.spriteHeight;
                } else {
                    // Reset animation after maximum of sprites is reached
                    unit.animWalking = 0;
                }
            }
        }
        if (unit.x === unit.targetX && unit.y === unit.targetY) {
        	unit.isAggro = true;
        }
    });
}

function updateCollision(dt) {
    // Collision Pass
    units.forEach(unit => {
        collidables.forEach(collidable => {
            if (unit.id === collidable.id) {
                return;
            }

            if (doesRectCollideRect(unit.collisionRect, collidable.collisionRect)) {
                unit.targetX = unit.x;
                unit.targetY = unit.y;

                unit.x = unit.x - unit.distanceTraveledX;
                unit.y = unit.y - unit.distanceTraveledY;
            }
        });
    });
}

function updateDying(dt) {
    units.forEach(unit => {
        if (unit.hp <= 0 ) {
            unit.isDead = true;
            unit.isAggro = false;
            unit.isAttacking = false;
            unit.fixedAggro = false;
            unit.targetX = unit.x;
            unit.targetY = unit.y;
        }
    });
}

function update(dt) {
    updateDying(dt);
    updateAttacking(dt);
    updateMovement(dt);
    updateCollision(dt);
}


//// render functions
function flushCanvas() {
    ctx.fillStyle = "#C5C19Cff";
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
}

function renderUnits() {
    units.forEach(unit => {
        fillRect(unit.collisionRect, '#11111122');
        fillRect(unit.attackRect, '#ff111122');
        fillRect(unit.sightRect, '#11991111');
        if (unit.isSelected) {
            strokeRect(unit.collisionRect, '#11ff11ff');
        }

        if (unit.isAttacking) {
            unit.animation = unit.animAttacking;
        } else {
            unit.animation = unit.animWalking;
        }

        if (unit.isDead) {
            unit.direction = 0;
            unit.animation = unit.animDead;
        }

        // Unit sprite
        ctx.drawImage(
            unit.sprite,
            unit.direction * unit.spriteWidth,
            unit.animation,
            unit.spriteWidth,
            unit.spriteHeight,
            unit.x - unit.collisionRadius - (unit.spriteRenderHeight - unit.height) / 2,
            unit.y - unit.collisionRadius - (unit.spriteRenderWidth - unit.width) / 2,
            unit.spriteRenderWidth,
            unit.spriteRenderHeight
        );
    });
}

function fillRect(r, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fillRect(r.x, r.y, r.width, r.height);
}

function strokeRect(r, strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.strokeRect(r.x, r.y, r.width, r.height);
}

function render() {
    flushCanvas();
    renderUnits();
}


//// Main Loop
let lastTimeStamp = 0;
function tick(timeStamp /* DOMHighResTimeStamp */) {
    const dt = (timeStamp - lastTimeStamp) / 1000;
    lastTimeStamp = timeStamp;

    update(dt);
    render();

    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
