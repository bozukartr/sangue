// Gianlico's controller: responsive run/jump (coyote time, jump buffer,
// variable height), crouch with headroom checks, a three-hit combo, a dodge
// with invulnerability frames, silent takedowns and damage/death handling.
import { CHAR_SCALE, DEPTH } from '../config.js';
import { audio } from '../core/audio.js';
import { state, ITEMS } from '../core/state.js';

const STAND = { w: 15, h: 28, ox: 4, oy: 3 };
const CROUCH = { w: 15, h: 18, ox: 4, oy: 13 };

// Combo steps: frame to show, damage, knockback, lunge speed.
const COMBO = [
  { frame: 23, damage: 12, knock: 160, lunge: 90, windup: 60, active: 90, recover: 110 },
  { frame: 24, damage: 14, knock: 200, lunge: 120, windup: 60, active: 90, recover: 120 },
  { frame: 24, damage: 24, knock: 420, lunge: 200, windup: 110, active: 110, recover: 220, heavy: true }
];

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.shadow = scene.add.ellipse(x, y + 34, 45, 8, 0x0b090a, 0.45).setDepth(DEPTH.player - 1);
    const sprite = scene.physics.add.sprite(x, y, 'gianlico-sheet', 0)
      .setScale(CHAR_SCALE).setDepth(DEPTH.player).setCollideWorldBounds(true);
    sprite.body.setSize(STAND.w, STAND.h).setOffset(STAND.ox, STAND.oy);
    sprite.body.setMaxVelocity(700, 1000);
    sprite.play('gianlico-idle');
    this.sprite = sprite;
    this.groundLine = y + 16 * CHAR_SCALE;

    this.moveSpeed = 300;
    this.crouchSpeed = 145;
    this.groundAccel = 2600;
    this.airAccel = 1500;
    this.groundDecel = 3200;
    this.jumpVelocity = -760;
    this.coyoteMs = 110;
    this.jumpBufferMs = 120;

    this.lastGroundedAt = -Infinity;
    this.jumpBufferedUntil = -Infinity;
    this.isCrouching = false;
    this.facing = 1;
    this.mode = 'move';
    this.modeTime = 0;
    this.invulnUntil = 0;
    this.dodgeReadyAt = 0;
    this.comboIndex = -1;
    this.lastAttackEnd = -Infinity;
    this.queuedAttack = false;
    this.locked = false;
    this.hidden = false;
    this.inLight = false;
    this.wasGrounded = true;
    this.stepDistance = 0;
    this.dropThroughUntil = 0;
    this.canFight = true;
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get body() { return this.sprite.body; }
  get dead() { return this.mode === 'dead'; }
  get grounded() { return this.sprite.body.blocked.down || this.sprite.body.touching.down; }

  setPosition(x, y) {
    this.sprite.setPosition(x, y ?? this.sprite.y);
    this.sprite.body.reset(x, y ?? this.sprite.y);
  }

  face(dir) {
    this.facing = dir < 0 ? -1 : 1;
    this.sprite.setFlipX(this.facing < 0);
  }

  walkTo(x, speed = 130) {
    return new Promise((resolve) => { this.walkTarget = { x, speed, resolve }; });
  }

  lock(on = true) {
    this.locked = on;
    if (on) {
      this.queuedAttack = false;
      if (this.mode !== 'dead') this.mode = 'move';
    }
  }

  canStandUp() {
    const body = this.sprite.body;
    const headroom = 10 * Math.abs(this.sprite.scaleY);
    // Standing and crouching share the same foot position; only the upper
    // ten sprite pixels need checking before restoring the taller body.
    return this.scene.physics.overlapRect(
      body.x + 1, body.y - headroom, body.width - 2, headroom - 1, false, true
    ).length === 0;
  }

  setCrouch(on) {
    if (on === this.isCrouching) return;
    this.isCrouching = on;
    const box = on ? CROUCH : STAND;
    this.sprite.body.setSize(box.w, box.h).setOffset(box.ox, box.oy);
  }

  update(time, delta, controls) {
    const sprite = this.sprite;
    const body = sprite.body;
    const dt = Math.min(delta / 1000, 0.033);
    const grounded = this.grounded;
    this.modeTime += delta;

    if (grounded) this.groundLine = body.bottom;
    this.shadow.setPosition(sprite.x, this.groundLine - 2);
    const lift = Math.max(0, this.groundLine - body.bottom);
    this.shadow.setScale(Math.max(0.5, 1 - lift / 400)).setAlpha(Math.max(0.12, 0.45 - lift / 600));

    if (this.mode === 'dead') {
      body.setVelocityX(body.velocity.x * 0.9);
      return;
    }

    // Blink while invulnerable after a hit.
    if (time < this.invulnUntil && this.mode !== 'dodge') sprite.setAlpha(Math.floor(time / 70) % 2 ? 0.45 : 1);
    else sprite.setAlpha(1);

    if (grounded) {
      if (!this.wasGrounded && this.fallSpeed > 420) {
        this.scene.fx?.puff(sprite.x, sprite.y + 32, 8);
        audio.sfx('land');
      }
      this.lastGroundedAt = time;
    }
    this.fallSpeed = body.velocity.y;
    this.wasGrounded = grounded;

    if (this.mode === 'hurt') {
      body.setVelocityX(body.velocity.x * 0.92);
      if (this.modeTime > 280) this.mode = 'move';
      this.updateVisual();
      return;
    }
    if (this.mode === 'dodge') { this.updateDodge(time, delta); return; }
    if (this.mode === 'attack') { this.updateAttack(time, delta, controls); return; }
    if (this.mode === 'takedown') {
      body.setVelocityX(0);
      if (this.modeTime > 420) this.mode = 'move';
      return;
    }

    // Scripted walk for cut-scenes.
    if (this.walkTarget) {
      const dx = this.walkTarget.x - sprite.x;
      if (Math.abs(dx) < 6) {
        body.setVelocityX(0);
        const done = this.walkTarget.resolve;
        this.walkTarget = null;
        done();
      } else {
        this.face(dx);
        body.setVelocityX(Math.sign(dx) * this.walkTarget.speed);
      }
      this.updateVisual();
      return;
    }

    const input = this.locked ? 0 : controls.axisX();
    const crouchHeld = !this.locked && controls.held.down;
    const jumpPressed = !this.locked && controls.pressed.jump;
    const jumpHeld = !this.locked && controls.held.jump;

    // Crouch + jump on a one-way ledge drops through it.
    if (crouchHeld && jumpPressed && grounded && time - (this.onOneWayAt || 0) < 80) {
      this.dropThroughUntil = time + 260;
      sprite.y += 4;
    } else if (jumpPressed && !crouchHeld) {
      this.jumpBufferedUntil = time + this.jumpBufferMs;
    }

    this.setCrouch((grounded && crouchHeld) || (this.isCrouching && !this.canStandUp()));

    const currentVx = body.velocity.x;
    if (input !== 0) {
      const target = input * (this.isCrouching ? this.crouchSpeed : this.moveSpeed);
      const accel = grounded ? this.groundAccel : this.airAccel;
      const next = Phaser.Math.Linear(currentVx, target,
        Math.min(1, (accel * dt) / Math.max(1, Math.abs(target - currentVx))));
      body.setVelocityX(next);
      this.face(input);
    } else {
      const step = this.groundDecel * dt;
      body.setVelocityX(Math.abs(currentVx) <= step ? 0 : currentVx - Math.sign(currentVx) * step);
    }

    if (!this.isCrouching && this.jumpBufferedUntil >= time && time - this.lastGroundedAt <= this.coyoteMs) {
      body.setVelocityY(this.jumpVelocity);
      this.jumpBufferedUntil = -Infinity;
      this.lastGroundedAt = -Infinity;
      audio.sfx('jump');
      this.scene.fx?.puff(sprite.x, sprite.y + 32, 4);
    }
    if (!jumpHeld && body.velocity.y < -260) body.setVelocityY(-260);

    if (!this.locked && this.canFight) {
      if (controls.pressed.attack) this.startAttack(time);
      else if (controls.pressed.dodge && time >= this.dodgeReadyAt) this.startDodge(time, input || this.facing);
    }
    if (!this.locked && controls.pressed.heal) this.useHeal();

    // Footsteps follow distance walked, not frames, so speed changes stay in time.
    if (grounded && Math.abs(body.velocity.x) > 40) {
      this.stepDistance += Math.abs(body.velocity.x) * dt;
      if (this.stepDistance > (this.isCrouching ? 90 : 70)) {
        this.stepDistance = 0;
        audio.sfx('step', { level: this.isCrouching ? 0.35 : 1 });
      }
    }
    this.updateVisual();
  }

  updateVisual() {
    const sprite = this.sprite;
    const body = sprite.body;
    const vx = body.velocity.x;
    const vy = body.velocity.y;
    if (this.mode === 'hurt') {
      sprite.anims.stop();
      sprite.setFrame(this.modeTime < 140 ? 26 : 27);
      return;
    }
    if (this.isCrouching) {
      if (Math.abs(vx) > 18) sprite.play('gianlico-crouch-walk', true);
      else { sprite.anims.stop(); sprite.setFrame(12); }
      return;
    }
    if (!this.grounded || vy < -10) {
      // Physics drives the vertical position; the pose follows ascent, apex
      // and descent so a short jump cannot get stuck showing a takeoff frame.
      sprite.anims.stop();
      sprite.setFrame(vy < -280 ? 18 : vy < 180 ? 19 : vy < 540 ? 20 : 21);
      return;
    }
    if (Math.abs(vx) > 35) sprite.play('gianlico-walk', true);
    else sprite.play('gianlico-idle', true);
  }

  // ---------------------------------------------------------- combat

  startAttack(time) {
    const target = this.scene.findTakedownTarget?.(this);
    if (target) {
      this.mode = 'takedown';
      this.modeTime = 0;
      this.setCrouch(false);
      this.face(target.x > this.x ? 1 : -1);
      this.sprite.anims.stop();
      this.sprite.setFrame(24);
      target.takedown(this);
      this.invulnUntil = time + 500;
      return;
    }
    this.setCrouch(false);
    this.comboIndex = time - this.lastAttackEnd < 380 ? (this.comboIndex + 1) % COMBO.length : 0;
    this.mode = 'attack';
    this.modeTime = 0;
    this.attackHit = false;
    this.queuedAttack = false;
    this.sprite.anims.stop();
    this.sprite.setFrame(22);
    audio.sfx('whoosh');
  }

  updateAttack(time, delta, controls) {
    const step = COMBO[this.comboIndex];
    const body = this.sprite.body;
    const t = this.modeTime;
    if (controls.pressed.attack && t > step.windup) this.queuedAttack = true;
    if (controls.pressed.dodge && t > step.windup + step.active && time >= this.dodgeReadyAt) {
      this.startDodge(time, controls.axisX() || this.facing);
      return;
    }
    if (t < step.windup) {
      body.setVelocityX(body.velocity.x * 0.7);
      this.sprite.setFrame(22);
    } else if (t < step.windup + step.active) {
      this.sprite.setFrame(step.frame);
      body.setVelocityX(this.facing * step.lunge);
      if (!this.attackHit) {
        this.attackHit = true;
        const hits = this.scene.meleeHit?.(this, {
          x: this.x + this.facing * 36, y: this.y, w: 58, h: 60,
          damage: step.damage, knock: step.knock, heavy: step.heavy, dir: this.facing
        }) || 0;
        if (hits) this.lastHitAt = time;
      }
    } else if (t < step.windup + step.active + step.recover) {
      this.sprite.setFrame(25);
      body.setVelocityX(body.velocity.x * 0.8);
      if (this.queuedAttack && t > step.windup + step.active + 40) {
        this.lastAttackEnd = time;
        this.startAttack(time);
      }
    } else {
      this.mode = 'move';
      this.lastAttackEnd = time;
      if (this.queuedAttack) this.startAttack(time);
    }
  }

  startDodge(time, dir) {
    this.mode = 'dodge';
    this.modeTime = 0;
    this.face(dir);
    this.setCrouch(false);
    this.dodgeReadyAt = time + 650;
    this.invulnUntil = Math.max(this.invulnUntil, time + 260);
    this.sprite.body.setVelocityX(this.facing * 640);
    this.sprite.anims.stop();
    this.sprite.setFrame(20);
    this.ghostTimer = 0;
    audio.sfx('dash');
  }

  updateDodge(time, delta) {
    const body = this.sprite.body;
    this.ghostTimer += delta;
    if (this.ghostTimer > 36) {
      this.ghostTimer = 0;
      const g = this.scene.add.image(this.x, this.y, 'gianlico-sheet', this.sprite.frame.name)
        .setScale(CHAR_SCALE).setFlipX(this.sprite.flipX).setTint(0x9c2b2f).setAlpha(0.5).setDepth(DEPTH.player - 1);
      this.scene.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
    }
    if (this.modeTime > 220) {
      this.mode = 'move';
      body.setVelocityX(this.facing * 200);
    }
  }

  // Returns true when the hit landed.
  damage(amount, fromX, knock = 240) {
    const time = this.scene.time.now;
    if (this.mode === 'dead' || time < this.invulnUntil) return false;
    state.data.health = Math.max(0, state.data.health - amount);
    this.scene.hud?.flashHurt();
    this.scene.fx?.shake(160, 0.008);
    this.scene.fx?.bleed(this.x, this.y - 10, 6);
    audio.sfx('hurt');
    const dir = this.x >= fromX ? 1 : -1;
    if (state.data.health <= 0) {
      this.die();
      return true;
    }
    this.mode = 'hurt';
    this.modeTime = 0;
    this.invulnUntil = time + 750;
    this.setCrouch(false);
    this.sprite.body.setVelocity(dir * knock, -180);
    return true;
  }

  die() {
    this.mode = 'dead';
    this.modeTime = 0;
    this.setCrouch(false);
    this.sprite.anims.stop();
    this.sprite.setFrame(28);
    this.sprite.setAlpha(1);
    this.scene.time.delayedCall(260, () => this.sprite.setFrame(29));
    audio.sfx('death');
    this.scene.events.emit('player-dead');
  }

  useHeal() {
    const d = state.data;
    if (d.health >= d.maxHealth) { audio.sfx('ui_error'); return; }
    // Prefer the item that wastes least.
    const missing = d.maxHealth - d.health;
    const order = missing > 45 ? ['panino', 'espresso'] : ['espresso', 'panino'];
    const id = order.find((key) => d.items[key] > 0);
    if (!id) { audio.sfx('ui_error'); this.scene.hud?.toast('Yanında yiyecek yok', '#8e8378'); return; }
    d.items[id]--;
    d.health = Math.min(d.maxHealth, d.health + ITEMS[id].heal);
    audio.sfx('heal');
    this.scene.hud?.toast(`${ITEMS[id].name}  +${ITEMS[id].heal}`, '#b8c8a0', `icon-${id}`);
    this.scene.hud?.refresh();
    const t = this.scene.add.image(this.x, this.y - 50, `icon-${id}`).setScale(2).setDepth(DEPTH.player + 5);
    this.scene.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }
}
