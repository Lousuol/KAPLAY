import kaplay from "https://unpkg.com/kaplay@3001.0.19/dist/kaplay.mjs";

kaplay({
    width: 500,
    height: 250,
    background: "#4379d7",
    letterbox: true, //aspect ratio
});

// ASSETS
loadSprite('player', 'assets/guy.png');
loadSprite('punch', 'assets/punch.png');

loadSprite('enemy1', 'assets/enemy1.png');
loadSprite('enemy2', 'assets/enemy2.png');
loadSprite('enemy3', 'assets/enemy3.png');
loadSprite('enemy4', 'assets/enemy4.png');
loadSprite('enemy5', 'assets/enemy5.png');

loadSprite('axe', 'assets/axe.png');
loadSprite('sword', 'assets/sword.png');
loadSprite('hammer', 'assets/hammer.png');

loadSprite('elf', 'assets/elf.png');
loadSprite('witch', 'assets/witch.png');
loadSprite('goblin', 'assets/goblin.png');

loadSprite('arrow', 'assets/arrow.png');
loadSprite('wand', 'assets/wand.png');
loadSprite('boulder', 'assets/boulder.png');

loadSprite('boom', 'assets/boom.png');

loadFont("happy", "assets/HappyFont.ttf");

// CONSTANTS
const teleportPos = [ // x = width & y = height
        vec2(-200, 100), // ground 1
        vec2(300, 100), // ground 2
        vec2(600, 100), // ground 3
        
        vec2(475, 0), // platform 1
        vec2(-50, 0), // platform 2
        
        vec2(-250, -100), // platform 3
        vec2(250, -100), // platform 4
        vec2(700, -100), // platform 5

        vec2(475, -200), // platform 6
        vec2(-50, -200), // platform 7
    ];

// GLOBAL
let player;
let playerWeapon = null; // chosen weapon
let playerCreature = null; // chosen creature
let specialAttack = null; // depends on creature
let playerMovement = null; // chosen movement
let playerBoost = null; // chosen boost

// PLAYER + attack ?
function makePlayer(x, y, spriteName = "player"){ 
    const SPEED = 100;

    // player sprite
    player = add([
        sprite(spriteName),
        pos(x, y),
        anchor("center"),
        health(100),
        scale(0.2),
        area(), // allows collision
        body(), // affected by gravity
        'player'
    ]);

    onKeyDown("a", () => {player.move(-SPEED, 0); player.flipX = true});
    onKeyDown("d", () => {player.move(SPEED, 0); player.flipX = false});
    onKeyPress("w", () => {if (player.isGrounded()) {player.jump(300)} }); // jump  
};

function corruptedPlayer(x, y, spriteName = "player"){
    const SPEED = 10;

    // player sprite
    player = add([
        sprite(spriteName),
        pos(x, y),
        anchor("center"),
        health(100),
        scale(0.2),
        area(), // allows collision
        body(), // affected by gravity
        'player'
    ]);

    // movements
    onKeyDown("d", () => {player.move(-SPEED, 0); player.flipX = true});
    onKeyDown("a", () => {player.move(SPEED, 0); player.flipX = false});
    onKeyPress("w", () => {if (player.isGrounded()) {player.jump(30)} });  
};

// UI
function healthBar(entity, x, y) {
    const maxHealth = entity.hp();
    const barWidth = 200;

    add([rect(barWidth, 20), pos(x, y), color(255, 0, 0), fixed()]); // red bar
    
    const healthBarFill = add([ // green bar
        rect(barWidth, 20), 
        pos(x, y), 
        color(0, 255, 0), 
        fixed() 
    ]);

    // life percentage
    entity.onUpdate(() => {healthBarFill.width = barWidth * (entity.hp() / maxHealth) });
};

function abilityReminder() {

    // positions
    const startX = 5; const startY = 50; const spacing = 65;

    // weapons
    // [{label: "main:\nJ"}, {label: "special:\nK"}, {label: "boost:\nL"}]
    const abilities = [{label: "arme\n\nJ"}, {label: "spécial\n\nK"}];

    if (playerBoost !== "damage") {abilities.push({label: "boost\n\nL"}) }

    // box + remember choice 
    abilities.forEach((ability, i) => {
        const boxY = startY + i * spacing;

        // box        
        add([
            rect(55, 55, {radius: 10}),
            outline(2),
            pos(startX, boxY),
            color("#ffffff"),
            area(),
            fixed(),
            "abilitiesBox"
        ]);

        // text inside box
        add([
            text(ability.label, {size: 12, align: "center", font: "happy"}),
            anchor("center"),
            pos(startX + 28, boxY + 30),
            color("#000000"),
            fixed(),
        ]);
    });
};

// WORLD
function platform(w, h, x, y) {
    add([
        rect(w, h), 
        pos(x, y), 
        color("#000000"), 
        area(), 
        body({isStatic: true})
    ]);
};

function limits(leftLimit, rightLimit){
    onUpdate(() => {
        player.pos.x = clamp(player.pos.x, leftLimit, rightLimit);
    });
};

// ENEMIES
function enemyFollow(enemy, SPEED) {
    onUpdate(() => {
        if (player.pos.x > enemy.pos.x) {
            enemy.move(SPEED, 0); 
            enemy.flipX = true; 
        } 
        else {
            enemy.move(-SPEED, 0); 
            enemy.flipX = false; 
        }
    });
};

function skeletonFight(enemy) { // special function

    function attackCycle() { 
        if (!enemy.exists()) return;  // when dead bullets stop

        // positions + facing
        enemy.pos = choose(teleportPos);
        enemy.flipX = player.pos.x > enemy.pos.x;
        
        wait(1, () => { // wait before shooting 
            
            if (!enemy.exists()) return;

            const offsetX = enemy.flipX ? 70 : -30; // where arrows appears 
            
            // arrow sprite
            const arrow = add([ 
                sprite("arrow"), 
                pos(enemy.pos.x + offsetX, enemy.pos.y + 40),
                scale(0.2), 
                area(), 
                anchor("center"), 
                "enemyArrow",
            ]); 
            
            arrow.flipX = !enemy.flipX; // flip arrow

            // arrow movement
            arrow.onUpdate(() => {
                const dir = player.pos.sub(arrow.pos).unit(); // calculate the direction towards the player
                arrow.move(dir.scale(150)); // speed
            });
                
            wait(2, () => destroy(arrow));
            wait(3, attackCycle); // repeat after 4 seconds
        }); 
    };
    attackCycle(); 
};

function teleportEnemy(enemy) {
    // every 2 seconds
    loop(2, () => {
        enemy.pos = choose(teleportPos); //chooses one of the possible positions available
    });
};

function enemyShoot(enemy) {
    loop(1.5, () => {
        if (!enemy.exists()) return; // when dead bullets stop

        const dir = player.pos.sub(enemy.pos).unit(); // calculate the direction towards the player

        const bullet = add([
            rect(10, 10),
            pos(enemy.pos),
            area(),
            color(255, 0, 0), // red
            "enemyBullet",
        ]);

        // bullet movement
        bullet.onUpdate(() => bullet.move(dir.scale(100)) );

        wait(3, () => destroy(bullet));
    });
}

// INTRODUCTION
scene("intro", () => {
    
    const bubble = add([ // bubble
        anchor("center"),
        pos(center()),
        rect(350, 160, {radius: 8}),
        outline(4),
        color("#ffffff"),
    ]);

    bubble.add([ // text
        // "Defeat enemies and upgrade\nyour abilities thanks\nto the constant patches\nmade by the developers.\nBut be careful!\nDon’t forget who you are."
        text("Élimine tes ennemis et\naméliore tes capacités grâce\naux mises à jour régulières\nproposées par les développeurs.\nMais attention !\n\nN'oublie pas qui tu es.", {
            size: 17,
            align: "center",
            font: "happy",
        }),
        anchor("center"),
        color("#000000"),
    ]);

    bubble.add([ // Press 'Enter' to continue
        text("Appuie sur ENTRÉE pour continuer", {size: 12, font: "happy"}),
        anchor("center"),
        pos(0, 100), 
        color("#000000"),
    ]);

    onKeyPress("enter", () => {go("controls")});
});

// CONTROLS  
scene("controls", () => {

    setGravity(400);
    makePlayer(350, 100);
    platform(300, 50, 200, 200);
    limits(210, 480);

    // texts
    add([pos(40, 50), text("COMMANDES:", {size: 15, font: "happy"})]); // CONTROLS
    add([pos(40, 80), text("- 'A' et 'D' pour bouger", {size: 15, font: "happy"}) ]); //- 'A' and 'D' to move
    onKeyPress("a", () => {add([pos(40, 100), text("- 'W' pour sauter", {size: 15, font: "happy"}) ]) }); // - 'W' to jump
    onKeyPress("w", () => {add([pos(40, 120), text("- 'J' pour attaquer", {size: 15,font: "happy"}) ]) }); // - 'J' to attack

    // attack
    onKeyPress("j", () => {
        const offsetX = player.flipX ? -300 : 300; // left - right
        
        const punch = player.add([
            sprite("punch"), 
            pos(offsetX, 0),
            anchor("center"), 
            scale(1), 
            area()
        ]);

        punch.flipX = player.flipX; // flip punch if player is flipped
        
        wait(0.3, () => {destroy(punch)});
        
        add([pos(40, 140), text("- ENTRÉE pour continuer", {size: 15, font: "happy"}) ]) // - 'Enter' to continue
        add([pos(310, 50), text("C'EST PARTI !", {size: 20, font: "happy"})]) // YOU'RE READY TO GO!
    });

    onKeyPress("enter", () => {go("fight1")});
});

// FIRST FIGHT : TROLL
scene("fight1", () => {
    setGravity(400);
    makePlayer(50,150);
    platform(500, 50, 0, 225);
    limits(20, 480);
    
    let enemyDefeated = false;

    // fight text
    const fightText = add([
        text("PREMIER COMBAT", {size: 40, font: "happy"}), // FIGHT ONE
        anchor('center'),
        pos(width()/2, height()/2 - 50),
    ]);

    // enemy
    const enemy1 = add([
        sprite('enemy1'),
        pos(350, 0),
        scale(0.25),
        area(),
        'enemy1'
    ]);

    // enemy follows you
    enemyFollow(enemy1, 10);

    // attack
    onKeyPress("j", () => {
        destroy(fightText);

        const offsetX = player.flipX ? -300 : 300; // left - right distance

        const punch = player.add([
            sprite("punch"),
            pos(offsetX, 0),
            anchor("center"),
            scale(1),
            area(),
            'punch'
        ]);

        punch.flipX = player.flipX;// flip punch if player is flipped
        wait(0.2, () => {destroy(punch)});
    });

    // defeat enemy + patch announcement
    onCollide("punch", "enemy1", () => {
        destroy(enemy1);
        enemyDefeated = true;

        wait(2, () => {
            add([
                text("c'est peut-être un peu trop puissant...", {size: 15, font: "happy"}), // maybe it's a bit too overpowered...
                anchor('center'),
                pos(width()/2, height()/2 - 20),
            ]);
        });

        // patch message
        wait(4, () => {
            const bubble = add([
                anchor("center"),
                pos(center()),
                rect(400, 150, {radius: 8}),
                outline(4),
                color("#ffffff"),
            ]);

            bubble.add([
                text("NOUVEAU PATCH !\n\n- 'Coup de poing' inflige\n-99 % de dégâts\n- Ajout d'armes dans le jeu !", { // NEW PATCH!\n\n- 'Punch' does -99% DMG\n- Addition of primary\nweapons to the game!
                    size: 20,
                    align: "center",
                    font: "happy",
                }),
                anchor("center"),
                color("#000000"),
            ]);
        });
    });

    // start again when it touches you
    onCollide("player", "enemy1", () => {wait(0.5, () => {go("fight1")}) });

    // go next scene
    onKeyPress("enter", () => {if(enemyDefeated) {go("patch1.01")}});
})

// PATCH 1 : WEAPONS
scene("patch1.01", () => {
    
    // text choice of weapon
    add([
        text("CHOISIS TON ARME", {size: 25, font: "happy"}), // CHOOSE YOUR WEAPON
        anchor('center'),
        pos(width()/2, height()/2 - 80),
    ]);

    // box's position
    const startX = 50; const startY = 90; const spacing = 150;

    // weapons
    const weapons = [{name: "sword", sprite: "sword"}, {name: "hammer", sprite: "hammer"}, {name: "axe", sprite: "axe"}];

    // box + remember choice of weapon
    weapons.forEach((weapon, i) => {
        const boxX = startX + i * spacing;
        
        // square for the weapons
        const box = add([
            rect(100, 100, {radius : 10}),
            outline(4),
            pos(boxX, startY),
            color("#ffffff"),
            area(),
            "weaponBox"
        ]);

        // add weapon inside the box
        add([
            sprite(weapon.sprite),
            scale(0.5),
            anchor("center"),
            pos(boxX + 50, startY + 50) // center of box
        ]);

        // when u click it stores the choice
        box.onClick(() => {playerWeapon = weapon.name; go("fight2")});
    });

});

// SECOND FIGHT : INSECT 
scene("fight2", () => {
    setGravity(400);
    makePlayer(50,150);
    platform(500, 50, 0, 225);
    limits(20, 480);

    let enemyDefeated = false;

    // fight text
    const fightText = add([
        text("DEUXIÈME COMBAT", {size: 40, font: "happy" }), // FIGHT TWO
        anchor('center'),
        pos(width()/2, height()/2 - 50),
    ]);

    // enemy
    const enemy2 = add([
        sprite('enemy2'),
        pos(350, 157),
        scale(0.15),
        health(100),
        area(),
        'enemy2'
    ]);

    // following
    enemyFollow(enemy2, 40);

    // health bars
    healthBar(player, 10, 15);
    healthBar(enemy2, 290, 15);

    // new attack system (weapons)
    onKeyPress("j", () => {
        destroy(fightText);
        
        let attackSprite = "punch"; // choose the correct attack sprite
        if (playerWeapon === "sword") {attackSprite = "sword"} 
        else if (playerWeapon === "hammer") {attackSprite = "hammer"} 
        else if (playerWeapon === "axe") {attackSprite = "axe"}

        const offsetX = player.flipX ? -200 : 200;

        const attack = player.add([
            sprite(attackSprite),
            pos(offsetX, 0),
            scale(2),
            anchor("center"),
            area(),
            "attack"
        ]);

        attack.flipX = player.flipX;

        wait(0.2, () => {destroy(attack) });
    }); 

    // damage system
    onCollide("attack", "enemy2", () => {enemy2.hurt(5)}); // player damage
    onCollide("player", "enemy2", () => {player.hurt(5)}); // enemy damage

    // deaths + patch notes
    enemy2.onDeath(() => {
        destroy(enemy2);
        enemyDefeated = true;

        wait(1, () => {
            add([
                text("c'est beaucoup mieux !", {size: 15, font: "happy"}), //now we're talking!
                anchor('center'),
                pos(width()/2, height()/2 - 20),
            ])
        });

        wait(3, () => {
            const bubble = add([
                anchor("center"),
                pos(center()),
                rect(400, 150, {radius: 8}),
                outline(4),
                color("#ffffff"),
            ]);

            bubble.add([
                anchor("center"),
                // NEW PATCH!\n\n- Addition of magical\ncreatures and powers\n- Also the sky's the limit
                text("NOUVEAU PATCH !\n\n- Ajout de créatures magiques\net de pouvoirs\n- Plus aucune limite !", {
                    size: 20,
                    align: "center",
                    font: "happy",
                }),
                color("#000000"),
            ]);
        });
    });

    player.onDeath(() => {wait(0.2, () => {go("fight2")})});

    // go next scene
    onKeyPress("enter", () => {if(enemyDefeated) {go("patch2.67")}});
});

// PATCH 2 : CREATURE
scene("patch2.67", () => {

    // text choice of creature
    add([
        text("CHOISIS TA CRÉATURE", {size: 25, font: "happy"}), // CHOOSE YOUR CREATURE
        anchor('center'),
        pos(width()/2, height()/2 - 80),
    ]);

    // positions
    const startX = 50; const startY = 90; const spacing = 150;

    // weapons
    const creatures = [{name: "elf", sprite: "elf"}, {name: "witch", sprite: "witch"}, {name: "goblin", sprite: "goblin"}];

    // box + remember choice
    creatures.forEach((creature, i) => {
        const boxX = startX + i * spacing;
        
        // square for the creatures
        const box = add([
            rect(100, 100, {radius : 10}),
            outline(4),
            pos(boxX, startY),
            color("#ffffff"),
            area(),
            "creatureBox"
        ]);

        // creature inside box
        add([
            sprite(creature.sprite),
            scale(0.2),
            anchor("center"),
            pos(boxX + 50, startY + 50) // in the center of box
        ]);

        // when u click it stores the choice
        box.onClick(() => {playerCreature = creature.name; go("fight3")});
    });
});

// THIRD FIGHT : SPIRIT
scene("fight3", () => {
    setGravity(400);
    makePlayer(225, 150, playerCreature);
    
    let enemyDefeated = false;

    // camera follows player
    onUpdate(() => {camPos(player.pos.x, player.pos.y - 50) });

    // text
    const fightText = add([
        text("TROISIÈME COMBAT", {size: 40,font: "happy"}), // FIGHT THREE
        anchor('center'),
        pos(width()/2, height()/2 - 50),
    ]);

    const abilityText = add([
        text("K pour la nouvelle compétence", {size: 15,font: "happy"}), //Press 'K' for new ability
        anchor('center'),
        pos(width()/2, height()/2),
    ])

    // main platform
    add([
        rect(1000, 50),
        pos(-300, 200),
        color("#000000"),
        area(),
        body({isStatic: true}),
    ]);

    // other platforms
    platform(200, 10, 375, 100); // w, h, x , y
    platform(200, 10, -75, 100);
    platform(200, 10, 150, 0);
    platform(200, 10, 375, -100);
    platform(200, 10, -75, -100);
    platform(200, 10, 600, 0);
    platform(200, 10, -300, 0);

    // enemy
    const enemy3 = add([
        sprite('enemy3'),
        pos(350, -100),
        health(100),
        scale(0.2),
        area(),
        'enemy3'
    ]);

    // following
    onUpdate(() => {
        const dir = player.pos.sub(enemy3.pos).unit(); // direction toward player
        enemy3.move(dir.scale(60)); // enemy speed
        if (dir.x > 0) {enemy3.flipX = true;
        } else if (dir.x < 0) {enemy3.flipX = false}
    });

    // health bars
    healthBar(player, 10, 15);
    healthBar(enemy3, 290, 15);
    
    // attack systems
    onKeyPress("j", () => {
        destroy(fightText);
        
        let attackSprite = "punch"; // choose the correct attack sprite
        if (playerWeapon === "sword") {attackSprite = "sword"} 
        else if (playerWeapon === "hammer") {attackSprite = "hammer"} 
        else if (playerWeapon === "axe") {attackSprite = "axe"}

        const offsetX = player.flipX ? -200 : 200;

        const attack = player.add([
            sprite(attackSprite),
            pos(offsetX, 0),
            scale(2),
            anchor("center"),
            area(),
            "attack"
        ]);

        attack.flipX = player.flipX;

        wait(0.2, () => {destroy(attack) });
    }); 

    let canUseSpecial = true;

    onKeyPress("k", () => { // special ability
        if (!canUseSpecial) return; // still on cooldown, do nothing
        canUseSpecial = false; // start cooldown

        destroy(abilityText);
        destroy(fightText);

        if (playerCreature === "elf") {specialAttack = "arrow"} 
        else if (playerCreature === "witch") {specialAttack = "wand"} 
        else if (playerCreature === "goblin") {specialAttack = "boulder"}

        const posX = player.flipX ? -20 : 20; // spawn projectile

        // create the projectile
        const projectile = add([
            sprite(specialAttack),
            pos(player.pos.x + posX, player.pos.y),
            scale(0.2),
            anchor("center"),
            area(),
            "specialAttack",
            {dir: player.flipX ? -1 : 1}, // store direction
        ]);

        projectile.flipX = player.flipX; // facing flip

        // projectile movement
        onUpdate(() => {projectile.move(200 * projectile.dir, 0) });

        wait(3, () => {destroy(projectile) }); // destroy proj after 3s
        wait(0.5, () => {canUseSpecial = true}); // reset cooldown after 0.5s
    });

    // damage system
    onCollide("player", "enemy3", () => {player.hurt(5)}); // enemy damage
    onCollide("attack", "enemy3", () => {enemy3.hurt(5)}); // main attack damage
    onCollide("specialAttack", "enemy3", (proj, enemy3) => {enemy3.hurt(10); destroy(proj) });

    // deaths + patch notes
    enemy3.onDeath(() => {
        destroy(enemy3);
        enemyDefeated = true;

        wait(1, () => {
            add([
                text("ouuuh ça devient sympa !", {size: 15, font: "happy"}), // uuuuu this is getting fun!
                anchor('center'),
                pos(width()/2, height()/2 + 10),
            ])
        });

        wait(3, () => {
            const bubble = add([
                anchor("center"),
                pos(center()),
                rect(400, 150, {radius: 8}),
                outline(4),
                color("#ffffff"),
                fixed(),
            ]);

            bubble.add([
                anchor("center"),
                text("NOUVEAU PATCH !\n\n- Amélioration des mouvements\n- Extension du territoire", { // NEW PATCH!\n\n- Movement improvements !\n- Domain expansion
                    size: 20,
                    align: "center",
                    font: "happy",
                }),
                color("#000000"),
            ]);
        });
    });

    player.onDeath(() => {wait(0.2, () => {go("fight3")}) });

    onUpdate(() => {if (player.pos.y > 1000) {go("fight3")}}); // start again if fall off

    // go next scene
    onKeyPress("enter", () => {if(enemyDefeated) {go("patch3.89")}});

});

// PATCH 3 : MOVEMENT
scene("patch3.89", () => {
    
    // text choice of movement
    add([
        text("CHOISIS UN NOUVEAU MOUVEMENT", {size: 25, font: "happy"}), // CHOOSE A NEW MOVEMENT
        anchor('center'),
        pos(width()/2, height()/2 - 80),
    ]);

    // positions
    const startX = 50; const startY = 90; const spacing = 150;

    // movements
    const movements = [{name: "dash", label: "DASH"}, {name: "doubleJump", label: "DOUBLE\nSAUT"}, {name: "speed", label: "VITESSE"}];

    // box + remember choice
    movements.forEach((movement, i) => {
        const boxX = startX + i * spacing;

        // box        
        const box = add([
            rect(100, 100, {radius : 10}),
            outline(4),
            pos(boxX, startY),
            color("#ffffff"),
            area(),
            "movementBox"
        ]);

        // text inside box
        add([
            text(movement.label, {size:20, align: "center", font: "happy"}),
            anchor("center"),
            pos(boxX + 50, startY + 50),
            color("#000000"),
        ]);

        // when u click it stores the choice
        box.onClick(() => {playerMovement = movement.name; go("fight4")});
    });
});

// FOURTH FIGHT : SKELETON
scene("fight4", () => {
    setGravity(400); 
    makePlayer(250, 150, playerCreature);
    
    let enemyDefeated = false;

    // camera
    camScale(0.45); 
    camPos(250, 0);

    // plateforms
    const ground = add([
        rect(1000, 50),
        pos(-250, 200),
        color("#000000"),
        area(),
        body({isStatic: true}),
    ]);

    platform(200, 10, 375, 100); // w, h, x , y
    platform(200, 10, -75, 100);
    platform(200, 10, 150, 0);
    platform(200, 10, 375, -100);
    platform(200, 10, -75, -100);
    platform(200, 10, 600, 0);
    platform(200, 10, -300, 0);

    // fight text
    const fightText = add([
        text("QUATRIÈME COMBAT", {size: 80,font: "happy"}), // FIGHT FOUR
        anchor('center'),
        pos(width()/2, height()/2 - 275),
    ]);

    // enemy
    const enemy4 = add([
        sprite('enemy4'),
        pos(teleportPos[0].x, teleportPos[0].y),
        health(100),
        scale(0.25),
        area(),
        'enemy4'
    ]);

    skeletonFight(enemy4);

    // health bars
    healthBar(player, 10, 15);
    healthBar(enemy4, 290, 15);

    // player movement system
    if (playerMovement === "dash") {
        let canDash = true;

        const abilityText = add([
            // Press 'Shift' for new ability
            text("SHIFT pour la nouvelle compétence", {size: 30, font: "happy"}),
            anchor('center'),
            pos(width()/2, height()/2 - 175),
        ]);

        onKeyPress("shift", () => {
            abilityText.destroy()

            if (!canDash) return;
            canDash = false;
            player.move(player.flipX ? -7000 : 7000, 0);
            wait(1, () => canDash = true);
        });
    }

    if (playerMovement === "doubleJump") {
        let jumpCount = 0;

        onKeyPress("w", () => {if (jumpCount < 2) {player.jump(300); jumpCount++} });
        onUpdate(() => {if (player.isGrounded()) {jumpCount = 0} });
    }

    if (playerMovement === "speed") {
        onKeyDown("a", () => {player.move(-100, 0); player.flipX = true});
        onKeyDown("d", () => {player.move(100, 0); player.flipX = false});
    }

    // player attack system
    onKeyPress("j", () => {
        destroy(fightText);
        
        let attackSprite = "punch"; // choose the correct attack sprite
        if (playerWeapon === "sword") {attackSprite = "sword"} 
        else if (playerWeapon === "hammer") {attackSprite = "hammer"} 
        else if (playerWeapon === "axe") {attackSprite = "axe"}

        const offsetX = player.flipX ? -200 : 200;

        const attack = player.add([
            sprite(attackSprite),
            pos(offsetX, 0),
            scale(2),
            anchor("center"),
            area(),
            "attack"
        ]);

        attack.flipX = player.flipX;

        wait(0.2, () => {destroy(attack) });
    }); 

    let canUseSpecial = true;

    onKeyPress("k", () => { // special ability
        if (!canUseSpecial) return; // still on cooldown, do nothing
        canUseSpecial = false; // start cooldown
        destroy(fightText);

        if (playerCreature === "elf") {specialAttack = "arrow"} 
        else if (playerCreature === "witch") {specialAttack = "wand"} 
        else if (playerCreature === "goblin") {specialAttack = "boulder"}

        const posX = player.flipX ? -20 : 20; // spawn projectile

        // create the projectile
        const projectile = add([
            sprite(specialAttack),
            pos(player.pos.x + posX, player.pos.y),
            scale(0.2),
            anchor("center"),
            area(),
            "specialAttack",
            {dir: player.flipX ? -1 : 1}, // store direction
        ]);

        projectile.flipX = player.flipX; // facing flip

        // projectile movement
        onUpdate(() => {projectile.move(200 * projectile.dir, 0) });

        wait(3, () => {destroy(projectile) }); // destroy proj after 3s
        wait(0.5, () => {canUseSpecial = true}); // reset cooldown after 0.5s
    });

    // damage system
    onCollide("enemyArrow", "player", (arrow, player) => {player.hurt(5); destroy(arrow)}); // enemy damage
    onCollide("attack", "enemy4", () => {enemy4.hurt(5)}); // main attack damage
    onCollide("specialAttack", "enemy4", (proj, enemy4) => {enemy4.hurt(10); destroy(proj) }); // special

    // deaths + patch notes
    enemy4.onDeath(() => {
        destroy(enemy4);
        enemyDefeated = true;

        wait(1, () => {
                add([
                    text("ça devient un touuuuuut petit peu difficile...", {size: 30, font: "happy"}), // okay it's getting a biiiiiiit too difficult i think...
                    anchor("center"),
                    pos(width()/2, height()/2 - 175),
                ])
            });

        wait(3, () => {
            const bubble = add([
                anchor("center"),
                pos(250, 0),
                rect(850, 300, {radius: 8}),
                outline(4),
                color("#ffffff"),
            ]);

            bubble.add([
                // NEW PATCH!\n\n- Special boosts !\n- Addition of final boss
                text("NOUVEAU PATCH !\n\n- Boosts spéciaux !\n- Ajout du boss final", {
                    size: 40,
                    align: "center",
                    font: "happy",
                }),
                anchor("center"),
                color("#000000"),
            ]);
        });
    });

    player.onDeath(() => {wait(0.2, () => {go("fight4")}) });

    onUpdate(() => {if (player.pos.y > 1000) {go("fight4")}}); // start again if fall off

    // go next scene
    onKeyPress("enter", () => {if(enemyDefeated) {go("patch4.20")}});

});

// PATCH 4 : BOOST
scene("patch4.20", () => {

    add([
        text("CHOISIS UN NOUVEAU BOOST", {size: 25, font: "happy"}), // CHOOSE A NEW BOOST
        anchor('center'),
        pos(width()/2, height()/2 - 80),
    ]);

    // positions
    const startX = 50; const startY = 90; const spacing = 150;

    // weapons
    const boosts = [{name: "healing", label: "SOIN"}, {name: "shield", label: "BOUCLIER"}, {name: "damage", label: "DÉGÂTS"}];

    // box + remember choice 
    boosts.forEach((boost, i) => {
        const boxX = startX + i * spacing;

        // box        
        const box = add([
            rect(100, 100, {radius : 10}),
            outline(4),
            pos(boxX, startY),
            color("#ffffff"),
            area(),
            "movementBox"
        ]);

        // text inside box
        add([
            text(boost.label, {size: 17.5, align: "center", font: "happy"}), //20
            anchor("center"),
            pos(boxX + 50, startY + 50),
            color("#000000"),
        ]);

        // when u click it stores the choice
        box.onClick(() => {playerBoost = boost.name; go("fight5")});
    });
});

// FIFTH FIGHT : VEIGAR
scene("fight5", () => {
    setGravity(400);
    makePlayer(250, 150, playerCreature);
    
    let enemyDefeated = false;

    // camera
    onUpdate(() => {camPos(player.pos) });
    camScale(0.6); 

    // plateforms
    const ground = add([
        rect(1000, 50),
        pos(-250, 200),
        color("#000000"),
        area(),
        body({isStatic: true}),
    ]);

    platform(200, 10, 375, 100); // w, h, x , y
    platform(200, 10, -75, 100);
    platform(200, 10, 150, 0);
    platform(200, 10, 375, -100);
    platform(200, 10, -75, -100);
    platform(200, 10, 600, 0);
    platform(200, 10, -300, 0);

    // fight text
    const fightText = add([
        text("COMBAT FINAL", {size: 80,font: "happy"}), // FINAL FIGHT
        anchor('center'),
        pos(width()/2, height()/2 + 30),
    ]);

    // enemy
    const enemy5 = add([
        sprite('enemy5'),
        pos(teleportPos[0].x, teleportPos[0].y),
        health(100),
        scale(0.25),
        area(),
        'enemy5'
    ]);

    enemyShoot(enemy5);
    teleportEnemy(enemy5);

    // health bars
    healthBar(player, 10, 15);
    healthBar(enemy5, 290, 15);

    // reminder of all abilities
    abilityReminder()

    // attack system
    onKeyPress("j", () => {
        destroy(fightText);
        
        let attackSprite = "punch"; // choose the correct attack sprite
        if (playerWeapon === "sword") {attackSprite = "sword"} 
        else if (playerWeapon === "hammer") {attackSprite = "hammer"} 
        else if (playerWeapon === "axe") {attackSprite = "axe"}

        const offsetX = player.flipX ? -200 : 200;

        const attack = player.add([
            sprite(attackSprite),
            pos(offsetX, 0),
            scale(2),
            anchor("center"),
            area(),
            "attack"
        ]);

        attack.flipX = player.flipX;

        wait(0.2, () => {destroy(attack) });
    }); 

    let canUseSpecial = true;

    onKeyPress("k", () => { // special ability
        if (!canUseSpecial) return; // still on cooldown, do nothing
        canUseSpecial = false; // start cooldown
        destroy(fightText);

        if (playerCreature === "elf") {specialAttack = "arrow"} 
        else if (playerCreature === "witch") {specialAttack = "wand"} 
        else if (playerCreature === "goblin") {specialAttack = "boulder"}

        const posX = player.flipX ? -20 : 20; // spawn projectile

        // create the projectile
        const projectile = add([
            sprite(specialAttack),
            pos(player.pos.x + posX, player.pos.y),
            scale(0.2),
            anchor("center"),
            area(),
            "specialAttack",
            {dir: player.flipX ? -1 : 1}, // store direction
        ]);

        projectile.flipX = player.flipX; // facing flip

        // projectile movement
        onUpdate(() => {projectile.move(200 * projectile.dir, 0) });

        wait(3, () => {destroy(projectile) }); // destroy proj after 3s
        wait(0.5, () => {canUseSpecial = true}); // reset cooldown after 0.5s
    });

    // player movement system
    if (playerMovement === "dash") {
        let canDash = true;

        const abilityText = add([
            // Press 'Shift' for new ability
            text("'shift' pour nouvelle compétence", {size: 30, font: "happy"}),
            anchor('center'),
            pos(width()/2, height()/2 - 175),
        ]);

        onKeyPress("shift", () => {
            abilityText.destroy()

            if (!canDash) return;
            canDash = false;
            player.move(player.flipX ? -7000 : 7000, 0);
            wait(1, () => canDash = true);
        });
    }

    if (playerMovement === "doubleJump") {
        let jumpCount = 0;

        onKeyPress("w", () => {if (jumpCount < 2) {player.jump(300); jumpCount++} });
        onUpdate(() => {if (player.isGrounded()) {jumpCount = 0} });
    }

    if (playerMovement === "speed") {
        onKeyDown("a", () => {player.move(-100, 0); player.flipX = true});
        onKeyDown("d", () => {player.move(100, 0); player.flipX = false});
    }

    // boost system
    if (playerBoost === "damage") {player.damageBoost = true}

    if (playerBoost === "healing" || playerBoost === "shield") {
        let canUseBoost = true;

        const abilityText = add([
            text("L pour la nouvelle compétence", {size: 20,font: "happy"}), // Press 'L' for new ability
            anchor("center"),
            pos(width()/2, height()/2 - 60),
        ])

        onKeyPress("l", () => {
            if (!canUseBoost) return;
            canUseBoost = false;

            destroy(abilityText);

            if (playerBoost === "healing") {
                if (player.hp() < 100) {
                    player.heal(Math.min(10, 100 - player.hp()));
                }
            }

            if (playerBoost === "shield") {
                const shield = player.add([
                    circle(300),
                    color("#ffc800"),
                    opacity(0.5),
                    anchor("center"),
                    area(),
                    "shield"
                ]);
                wait(1.5, () => destroy(shield));
            }
            wait(3, () => canUseBoost = true);
        })
    };

    // damage system
    onCollide("player", "enemyBullet", (player, bullet) => {player.hurt(10); destroy(bullet) }); // enemy attack

    // bullets destroyed if shield
    onCollide("enemyBullet", "shield", (bullet) => {destroy(bullet) });

    onCollide("attack", "enemy5", () => { // main attack 
        let dmg = 5;
        if (player.damageBoost) dmg *= 2;
        enemy5.hurt(dmg);
    }); 

    onCollide("specialAttack", "enemy5", (projectile, enemy5) => { // special attack
        let dmg = 10;
        if (player.damageBoost) dmg *= 2;
        enemy5.hurt(dmg);
        destroy(projectile);
    });

    // deaths + patch notes
    enemy5.onDeath(() => {
        destroy(enemy5);
        enemyDefeated = true;

        wait(1, () => {
            add([
                text("?????", {size: 20, font: "happy"}),
                anchor('center'),
                pos(width()/2, height()/2 + 10),
            ])

            wait(1, () => {
                // i didn't think that was possible
                add([
                    text("je ne pensais pas que c'était possible...", {size: 20, font: "happy"}),
                    anchor('center'),
                    pos(width()/2, height()/2 + 30),
                ])
            });
        });

        wait(4, () => {
            const bubble = add([
                anchor("center"),
                pos(250, 100),
                rect(450, 200, {radius: 8}),
                outline(4),
                color("#ffffff"),
            ]);

            bubble.add([
                anchor("center"),
                // NEW PATCH!\n\n- Well done ?\n- I guess...
                text("NOUVEAU PATCH !\n\n- Bravo ?\n- Je suppose...", {
                    size: 30,
                    align: "center",
                    font: "happy",
                }),
                color("#000000"),
            ]);
        });
    });

    player.onDeath(() => {
        destroy(enemy5);

        wait(1, () => {
            const bubble = add([
                anchor("center"),
                pos(250, 150),
                rect(500, 250, {radius: 8}),
                outline(4),
                color("#ffffff"),
            ]);

            bubble.add([
                // Well that was\ncertainly something...\n\nDo you need help ?
                text("Euuuh, je vois...\n\nTu as besoin d'aide ?", {
                    size: 30,
                    align: "center",
                    font: "happy",
                }),
                anchor("center"),
                pos(0, -40),
                color("#000000"),
            ]);

            // YES button
            const yesButton = bubble.add([
                pos(-110, 70),
                rect(120, 50, {radius: 6}),
                color(0, 255, 0), // green
                outline(3),
                anchor("center"),
                area(),
            ]);

            yesButton.add([
                text("Oui", {size: 28, align: "center", font: "happy"}),
                anchor("center"),
                color("#000000"),
            ]);

            yesButton.onClick(() => {go("coolFight")});

            // NO button
            const noButton = bubble.add([
                pos(110, 70),
                rect(120, 50, {radius: 6}),
                color(255, 0, 0), // red
                outline(3),
                anchor("center"),
                area(),
            ]);

            noButton.add([
                text("Non", {size: 28, align: "center", font: "happy"}),
                anchor("center"),
                color("#000000"),
            ]);

            noButton.onClick(() => {shake(1)});
        });
    });

    onUpdate(() => {if (player.pos.y > 1000) {go("fight5")} }); // start again if fall off

    onKeyPress("enter", () => {if(enemyDefeated) {go("reversed")} }); // next scene
});

// COOL FIGHT SCENE
scene("coolFight", () => {

    setBackground("#000000");
    makePlayer(50, 200, playerCreature);
    platform(500, 50, 0, 200);
    limits(50, 50);
    
    // enemy5
    const enemy5 = add([
        sprite('enemy5'),
        pos(350, 50),
        scale(0.3),
        area(),
        'enemy5',
    ]);

    // following
    onUpdate(() => {
        const dir = player.pos.sub(enemy5.pos).unit(); // direction toward player
        enemy5.move(dir.scale(5)); // enemy speed
        if (dir.x > 0) {enemy5.flipX = false;
        } else if (dir.x < 0) {enemy5.flipX = true}
    });

    // press 'space' text
    const pressSpace = add([
        text("ESPACE pour attaquer !", {size: 24, font: "happy"}), //Press SPACE to attack!
        anchor("center"),
        pos(width()/2, height()/2 - 75),
    ]);

    // explosion
    onKeyPress("space", () => {
        destroy(pressSpace);
        shake(100);

        const boom = add([
            sprite('boom'),
            pos(player.pos.x + 100, player.pos.y - 300),
            scale(2),
            area(),
            'boom'
        ]);

        // départ, arrivée, durée, opacité, easing (courbe d'animation)
        tween(1, 0, 2, (v) => boom.opacity = v, easings.easeOutQuad)
        
        wait(3, () => {go("aftermath") });
    });

    // kill enemy5 on contact
    onCollide("boom", "enemy5", () => {destroy(enemy5)});

});

// TEXT
scene("aftermath", () => {
    setBackground("#000000");

    wait(1.5, () => {

        const text1 = add([
            text("...", {size: 20, font: "happy"}),
            anchor("center"),
            pos(width()/2, height()/2),
            color("#ffffff"),
        ]);

        wait(2, () => {
            destroy(text1);

            add([
                text("Qu'est-ce qui t'est arrivé ?", {size: 20, font: "happy"}), // what happened to you?
                anchor("center"),
                pos(width()/2, height()/2),
                color("#ffffff"),
            ]);

            wait(5, () => {
                add([
                    text("Appuie sur ENTRÉE", {size: 10, font: "happy"}), // press enter
                    anchor("center"),
                    pos(width()/2, height()/2 + 100),
                    color("#ffffff"),
                ]);
            })

            onKeyPress("enter", () => {go("reversed")});
        })
    })
});

// REVERSED COMMANDS
scene("reversed", () => {
    setGravity(100);
    corruptedPlayer(250, 200, playerCreature);
    limits(220, 280);
    
    // platform
    add([
        rect(500, 50), 
        pos(0, 200), 
        color("#000000"), 
        area(), 
        body({isStatic: true})
    ]);

    // bugged abilities
    onKeyPress("j", () => {shake(1)});
    onKeyPress("k", () => {shake(1)});
    onKeyPress("l", () => {shake(1)});
    onKeyPress("shift", () => {shake(1)});

    // text
    wait(1.5, () => {
        
        const text1 = add([
            text("Tu as changé…", {size: 20, font: "happy"}), // you've changed
            anchor("center"),
            pos(width()/2, height()/2 - 50),
            color("#ffffff"),
        ]);

        // changer
        wait(4, () => {
            destroy(text1);
            
            add([
                text("Tu t'es rendu compte de ça ?", {size: 20, font: "happy"}), //have you realized that?
                anchor("center"),
                pos(width()/2, height()/2 - 50),
                color("#ffffff"),
            ]);

            // enter
            wait(5, () => {
                add([
                    text("appuies sur 'Entrée'", {size: 10, font: "happy"}), // press 'Enter'
                    anchor("center"),
                    pos(width()/2, height()/2 + 100),
                    color("#ffffff"),
                ]);
            })
            onKeyPress("enter", () => {go("reflection")});
        })
    })
});

// REFLECTION SCENES (ONLY TEXT)
scene("reflection", () => {
    add([
        text("Tu te souviens du début ?", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);

    onKeyPress("enter", () => {go("reflection2")});
});

scene("reflection2", () => {
    add([
        text("Tu étais si petit·e.\nTu n'avais rien.\n\nNi d'armes, ni de pouvoirs.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2 - 50),
        color("#ffffff"),
    ]);

    // player sprite
    add([
        sprite('player'),
        pos(250, 175),
        anchor("center"),
        scale(0.3),
        'player'
    ]);

    onKeyPress("enter", () => {go("reflection3")});
})

scene("reflection3", () => {
    add([
        text("Et puis tu as fait des choix.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
    onKeyPress("enter", () => {go("reflection4")});
});

scene("reflection4", () => {
    add([
        text("Chaque amélioration que\ntu as intégré était\nune partie de toi qui\n\nchangeait.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
    onKeyPress("enter", () => {go("reflection5")});
});

scene("reflection5", () => {
    add([
        text("Et regarde-toi maintenant.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2 - 50),
        color("#ffffff"),
    ]);

    // to put the choices made in the game
    const specialSprites = {elf: "arrow", witch: "wand", goblin: "boulder"};

    const choices = [
        {sprite: playerWeapon},
        {sprite: playerCreature},
        {sprite: specialSprites[playerCreature]}
    ];

    choices.forEach((choice, i) => {
        add([
            sprite(choice.sprite),
            anchor("center"),
            pos(width()/2 - 145 + i * 150, height()/2 + 25),
            scale(0.3)
        ]);
    });

    onKeyPress("enter", () => {go("reflection6")});
});

scene("reflection6", () => {
    add([
        text("Est-ce que tu es encore\nle même personnage\nqu'au départ ?", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2 - 50),
        color("#ffffff"),
    ]);

    // player sprite
    add([
        sprite('player'),
        pos(width()/2 - 200, height()/2 + 20),
        anchor("center"),
        scale(0.3),
        'player'
    ]);

    // chosen creature sprite
    const creature = add([
        sprite(playerCreature),
        anchor("center"),
        pos(width()/2 + 200, height()/2 + 20),
        scale(0.3),
    ])
    creature.flipX = true;

    onKeyPress("enter", () => {go("reflection7")});
});

scene("reflection7", () => {
    add([
        text("Tout comme une chenille,\nqui mange et qui grandit,\nun jour tu t’es réveillé·e…\net sans vraiment le\nvouloir, tu es devenu·e\n\nautre chose.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
    onKeyPress("enter", () => {go("reflection8")});
});

scene("reflection8", () => {
    add([
        text("Tu as pris des décisions.\n\nCombat après combat.\nPatch après patch.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
    onKeyPress("enter", () => {go("reflection9")});
});

scene("reflection9", () => {
    add([
        text("Comme une métamorphose,\ntu as changé petit à petit, jusqu'à\ndevenir quelqu'un de nouveau.", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
    onKeyPress("enter", () => {go("reflection10")});
});

scene("reflection10", () => {
    add([
        text("Alors dis-moi…\n\nsi tu pouvais recommencer,\nreferais-tu les mêmes choix ?", {size: 25, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
    onKeyPress("enter", () => {go("end")});
});

scene("end", () => {
    add([
        text("M.E.T.A.!", {size: 60, align: "center", font: "happy"}),
        anchor("center"),
        pos(width()/2, height()/2),
        color("#ffffff"),
    ]);
});

// START GAME 
go("intro"); 
// patch1.01
// patch2.67
// patch3.89
// patch4.20

