# Sprite Spawning Issues - Currently Disabled

## Problems Identified
1. Yoshi spawning doesn't work (multiple methods tried)
2. Enemy spawning creates wrong/random sprites
3. Block spawning causes Mario to get stuck
4. Sprite IDs appear to be incorrect or incomplete initialization

## What's Disabled
- All enemy spawning (Koopa, Goomba, Boo, etc.)
- Yoshi spawning
- Block spawning
- Floor hazards
- Boss spawning
- Enemy waves

## What Still Works
✅ Lives (add/remove) - Direct memory write
✅ Coins (add/remove) - Direct memory write  
✅ Power-ups (Mushroom, Fire, Cape, Star) - Direct memory write
✅ Physics chaos (speed, gravity, jump) - Direct memory manipulation
✅ Running controls (force/disable) - Direct memory manipulation
✅ Level warping - Direct level ID change
✅ Invincibility - Star timer manipulation

## Future Research Needed
- Proper sprite initialization sequence for vanilla SMW
- Extended sprite tables vs normal sprite tables
- Game mode checks before spawning
- Sprite status/state values for different sprite types
- Yoshi riding flag location verification

## Focus
Only vanilla Super Mario World (US 1.0) - no ROM hacks for now
