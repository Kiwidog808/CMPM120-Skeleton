Pico-Rage by Garrick Yanagawa & Cajun Wikoff

Assets/Sprites: 
- Pico-8 Platformer
- Link: https://kenney.nl/assets/pico-8-platformer
    - We also hue-shifted some assets on our own to create different colored assets/sprites for levels
        - Ex: Start/End blocks, colored platforms, grass/trees
    - We also made and added our own sign sprite to the spritesheet

Controls: 
- A/D or Left/Right arrow keys to move
- SPACE to jump (press SPACE when in the air to dash)
    - Control dash direction (8-directional dash) with WASD or Left/Right/Up/Down
- E to interact
- C to place checkpoint
- R to restart
- 0 to return to the Starting Level

Camera Behavior:
- Camera moves up and down with the player's y-level, with a deadzone on the y-axis
    - Camera doesn't move on the x-axis at all

Levels & Mechanics:
- Cajun Wikoff created the Starting (Intro) Level and the "Jelly" Level
    - The Starting Level functions as a hub where the player can access both the actual level sequence AND practice modes (with "infinite" checkpoints) for each individual level
    - The Starting Level has normal friction and jump height, accompanied with some light platforming to introduce mechanics
    - The Jelly Level is the 2nd level in the sequence that has normal jump height BUT low friction as to be slippery like jelly
- Garrick Yanagawa created the Ending Level and the "Peanut Butter" Level
    - The Ending Level functions as an end screen to the game, but still includes gameplay and functions like a "secret", 3rd level
    - The Ending Level can only be accessed via beating both levels 1 and 2 sequentially in normal mode
    - The Ending Level uses nromal friction and jump height
    - The Peanut Butter Level is the 1st level in the sequence that has reduced jump height AND high friction to simulate sticky Peanut Butter

Level Select:
- As mentioned prior, the player will spawn in the Starting Level where, once reaching the top, the player can choose to attempt the real level sequence OR a practice mode of each individual level (where the player is given 100 checkpoints and reaching the end will take the player back to the Starting Level)

Bonus Elements:
1. As mentioned under "Camera Behavior", our game is locked to the player's y-level and includes a deadzone on the y-axis using startFollow()
2. Our player is able to dash in one of 8 directions when pressing SPACE while in the air
    - The player gets one dash, which resets when they touch the ground or a jump pad
3. Aside from the singular required audio "juice" (jump sound effect) and two required particle "juice" (landing and dashing), there are the following additional effects:
    - Audio juice for collecting coins or stars, dashing, dying, collecting checkpoint, placing checkpoint, and walking (one for Jelly, one for Peanut Butter, and a final one for the Start/End)
    - 4 custom background songs (one for each level)
        - The music slowly gets louder and more "deep fried" as time goes on to reflect the player slowly loosing their sanity as they progress. This effect is reset whenever the player enters the Starting Level.
        - Note: All sound effects and music was made by us
    - Animated player jumping sprite (player changes sprite when jumping)
    - Player darkens when dash is used up
4. The player can die to both spikes and enemies placed in the levels
    - Dying sends the player back to the start of the level OR the last placed checkpoint
5. Both main levels have enemies that move back and forth on a set path
    - These enemies kill the player upon contact
6. Both main levels contain lock-and-key puzzles, where the player must collect a key to be able to access a locked area
7. This may not count as a secret level, but I will mention it anyway: There is a secret Ending Level (as mentioned in "Levels & Mechanics") that the player doesn't know about or get to play until beating both levels in the normal sequence
    - There is no way to practice this level
    - This level functions as an end screen to the game, meaning you must beat it to "truly" beat the game
    - Functions similar to a secret additional level that appears once the player THINKS they beat the game
8. All 4 levels have one checkpoint powerup that the player can grab
    - Picking this powerup up gives the player one placeable checkpoint that they can use only in the current level (they aren't carried over)
    - Dying without placing the checkpoint doesn't save it in the player's inventory
    - All checkpoints are obtained through the lock-and-key puzzles EXCEPT for Ending Level, where it is given for free
9. There are interactable signs in both the Starting Level and Ending Level that are accessed by pressing "E"
    - There serve to introduce mechanics in the Starting Level and to give credit to us (the creators) and as taunts in the Ending Level
