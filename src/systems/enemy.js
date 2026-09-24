// Enemy AI. Patrolling guards see through a visible cone; suspicion fills
// faster the closer and better-lit Gianlico is. At full suspicion they raise
// the alarm, chase, telegraph and throw punches. Unaware enemies can be
// taken down silently from behind; a guard who spots a downed colleague
// comes to investigate.
import { CHAR_SCALE, DEPTH, FONT } from '../config.js';
import { audio } from '../core/audio.js';
import { state } from '../core/state.js';

export const ENEMY_TYPES = {
  thug: { sheet: 'thug', hp: 40, speed: 95, chase: 235, damage: 12, range: 360, lira: [400, 1200], name: 'SCAGNOZZO' },
  thug2: { sheet: 'thug2', hp: 55, speed: 90, chase: 225, damage: 15, range: 340, lira: [600, 1500], name: 'SCAGNOZZO' },
  guard: { sheet: 'guard', hp: 50, speed: 80, chase: 240, damage: 14, range: 420, lira: [300, 900], flashlight: true, name: 'GUARDIA' },
  agent: { sheet: 'agent', hp: 60, speed: 75, chase: 250, damage: 0, range: 400, lira: [0, 0], flashlight: true, catcher: true, noTakedown: true, name: 'AGENTE' }
};

const STAND = { w: 15, h: 28, ox: 4, oy: 3 };

export class Enemy {
  constructor(scene, cfg) {
    this.scene = scene;
    this.cfg = cfg;
    this.type = ENEMY_TYPES[cfg.type] || ENEMY_TYPES.thug;
    this.sheet = this.type.sheet;
    this.hp = cfg.hp ?? this.type.hp;
    this.maxHp = this.hp;
    this.patrol = cfg.patrol || null;
    this.waitMs = cfg.wait ?? 1400;
    this.facing = cfg.facing ?? 1;
    this.mode = cfg.patrol ? 'patrol' : 'idle';
    this.modeTime = 0;
    this.suspicion = 0;
    this.alerted = false;
    this.lastSeen = null;
    this.lostTime = 0;
    this.attackReadyAt = 0;
    this.home = cfg.x;

    this.shadow = scene.add.ellipse(cfg.x, 0, 42, 8, 0x0b090a, 0.4).setDepth(DEPTH.npc - 1);
    const sprite = scene.physics.add.sprite(cfg.x, cfg.y, `${this.sheet}-sheet`, 0)
      .setScale(CHAR_SCALE).setDepth(DEPTH.npc);
    sprite.body.setSize(STAND.w, STAND.h).setOffset(STAND.ox, STAND.oy);
    sprite.body.setMaxVelocity(500, 1000);
    sprite.setCollideWorldBounds(true);
    sprite.play(`${this.sheet}-idle`);
    sprite.enemy = this;
    this.sprite = sprite;
    this.setFacing(this.facing);

    const coneColor = this.type.flashlight ? 0xfff0c0 : 0xe8d8a0;
    this.cone = scene.add.image(cfg.x, cfg.y, 'cone').setDepth(DEPTH.props + 1)
      .setTint(coneColor).setAlpha(this.type.flashlight ? 0.2 : 0.1).setBlendMode(Phaser.BlendModes.ADD);
    this.mark = scene.add.image(cfg.x, cfg.y - 60, 'mark-q').setScale(2.5).setDepth(DEPTH.npc + 5).setVisible(false);
    this.meter = scene.add.rectangle(cfg.x, cfg.y - 44, 30, 4, 0xe8c14a).setDepth(DEPTH.npc + 5).setVisible(false);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get down() { return this.mode === 'down'; }
  get aware() { return this.alerted || this.mode === 'investigate'; }

  setFacing(dir) {
    this.facing = dir < 0 ? -1 : 1;
    this.sprite.setFlipX(this.facing < 0);
  }

  eye() {
    return { x: this.x + this.facing * 8, y: this.y - 20 };
  }

  // ----------------------------------------------------------- perception

  canSee(px, py, range) {
    const eye = this.eye();
    const dx = (px - eye.x) * this.facing;
    if (dx < -12 || dx > range) return false;
    if (Math.abs(py - eye.y) > 40 + Math.max(0, dx) * 0.21) return false;
    return this.scene.lineOfSight(eye.x, eye.y, px, py);
  }

  perceive(delta, player) {
    const dt = delta / 1000;
    const body = player.body;
    const target = { x: player.x, y: player.isCrouching ? body.top + 8 : body.top + 14 };
    let range = this.type.range;
    const lit = player.inLight;
    if (!lit && this.scene.fx.darkness) range *= this.type.flashlight ? 0.75 : 0.55;
    const dist = Math.abs(player.x - this.x);
    const close = dist < 46 && Math.abs(player.y - this.y) < 60;
    // Crouching behind cover hides even at arm's length, so a patrol can walk
    // past; darkness alone does not survive someone stepping on you.
    const hidden = player.hidden && (!close || player.inCover);

    let sees = false;
    if (!player.dead && !hidden && this.canSee(target.x, target.y, range)) sees = true;
    // Anyone bumping into a guard gets noticed, even from behind.
    if (!player.dead && close && Math.abs(player.body.velocity.x) > 160 && !player.isCrouching) sees = true;

    if (sees) {
      const closeness = 1 - Math.min(1, dist / range);
      let rate = 0.45 + closeness * 2.4;
      if (player.isCrouching) rate *= 0.6;
      if (lit) rate *= 1.5;
      if (this.mode === 'investigate') rate *= 1.6;
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.lostTime = 0;
    } else {
      this.suspicion = Math.max(0, this.suspicion - (this.alerted ? 0.12 : 0.3) * dt);
      this.lostTime += delta;
    }

    // A colleague on the ground is cause for alarm.
    if (!this.alerted) {
      this.scene.enemies.forEach((other) => {
        if (other === this || !other.down || other.noticed) return;
        if (this.canSee(other.x, other.y + 20, this.type.range * 0.8)) {
          other.noticed = true;
          this.suspicion = Math.max(this.suspicion, 0.65);
          this.lastSeen = { x: other.x, y: other.y };
          this.investigate(other.x);
          this.say('Cosa...?!');
        }
      });
    }
    return sees;
  }

  // ----------------------------------------------------------- behaviour

  update(time, delta, player) {
    const sprite = this.sprite;
    const body = sprite.body;
    this.modeTime += delta;
    const grounded = body.blocked.down || body.touching.down;
    this.shadow.setPosition(sprite.x, body.bottom - 1).setVisible(grounded);

    if (this.mode === 'down') {
      body.setVelocityX(body.velocity.x * 0.9);
      this.cone.setVisible(false);
      this.mark.setVisible(false);
      this.meter.setVisible(false);
      return;
    }

    const sees = this.perceive(delta, player);
    if (!this.alerted && this.suspicion >= 1) this.raiseAlarm(player);
    if (this.alerted && !sees && this.lostTime > 5200) this.calmDown();

    switch (this.mode) {
      case 'idle':
        body.setVelocityX(0);
        this.anim('idle');
        if (this.cfg.turn && this.modeTime > this.cfg.turn) { this.modeTime = 0; this.setFacing(-this.facing); }
        if (!this.alerted && this.suspicion > 0.35 && this.lastSeen) this.investigate(this.lastSeen.x);
        break;
      case 'patrol': this.updatePatrol(); break;
      case 'wait':
        body.setVelocityX(0);
        this.anim('idle');
        if (this.modeTime > this.waitMs) { this.setFacing(-this.facing); this.mode = 'patrol'; this.modeTime = 0; }
        if (this.suspicion > 0.35 && this.lastSeen) this.investigate(this.lastSeen.x);
        break;
      case 'investigate': this.updateInvestigate(); break;
      case 'chase': this.updateChase(time, player); break;
      case 'windup':
        body.setVelocityX(0);
        this.sprite.anims.stop();
        this.sprite.setFrame(22);
        this.sprite.setTintFill(Math.floor(this.modeTime / 60) % 2 ? 0xffffff : 0xffd0a0);
        if (this.modeTime > (this.cfg.windup ?? 380)) {
          this.sprite.clearTint();
          this.mode = 'strike';
          this.modeTime = 0;
          audio.sfx('whoosh');
          this.sprite.setFrame(24);
          body.setVelocityX(this.facing * 160);
          const dx = (player.x - this.x) * this.facing;
          if (dx > -10 && dx < 74 && Math.abs(player.y - this.y) < 56) {
            if (player.damage(this.cfg.damage ?? this.type.damage, this.x)) {
              audio.sfx('hit');
              this.scene.fx.hitSpark(player.x - this.facing * 8, player.y - 12, 6);
            }
          }
        }
        break;
      case 'strike':
        body.setVelocityX(body.velocity.x * 0.85);
        if (this.modeTime > 160) { this.mode = 'recover'; this.modeTime = 0; this.sprite.setFrame(25); }
        break;
      case 'recover':
        body.setVelocityX(0);
        if (this.modeTime > 420) { this.mode = 'chase'; this.modeTime = 0; }
        break;
      case 'hurt':
        body.setVelocityX(body.velocity.x * 0.9);
        this.sprite.anims.stop();
        this.sprite.setFrame(this.modeTime < 120 ? 26 : 27);
        if (this.modeTime > 300) { this.sprite.clearTint(); this.mode = this.alerted ? 'chase' : 'investigate'; this.modeTime = 0; }
        break;
      default: break;
    }
    this.updateOverlay();
  }

  anim(name) {
    this.sprite.play(`${this.sheet}-${name}`, true);
  }

  updatePatrol() {
    const [a, b] = this.patrol;
    const body = this.sprite.body;
    const target = this.facing > 0 ? b : a;
    const blocked = this.facing > 0 ? body.blocked.right : body.blocked.left;
    if (blocked || (this.facing > 0 && this.x >= target) || (this.facing < 0 && this.x <= target)) {
      body.setVelocityX(0);
      this.mode = 'wait';
      this.modeTime = 0;
      return;
    }
    body.setVelocityX(this.facing * this.type.speed);
    this.anim('walk');
  }

  investigate(x) {
    if (this.alerted) return;
    if (this.mode !== 'investigate') {
      audio.sfx('suspicious');
      this.state0 = this.mode;
    }
    this.mode = 'investigate';
    this.modeTime = 0;
    this.investigateX = x;
  }

  updateInvestigate() {
    const body = this.sprite.body;
    const dx = this.investigateX - this.x;
    if (Math.abs(dx) > 16 && this.modeTime < 6000) {
      this.setFacing(dx);
      body.setVelocityX(Math.sign(dx) * this.type.speed * 1.3);
      this.anim('walk');
      if ((body.blocked.left || body.blocked.right) && body.blocked.down) body.setVelocityY(-620);
    } else {
      body.setVelocityX(0);
      this.anim('idle');
      // Look around, then give up.
      if (this.modeTime % 1400 < 20) this.setFacing(-this.facing);
      if (this.modeTime > 7000 || (Math.abs(dx) <= 16 && this.modeTime > 3200 && this.suspicion < 0.2)) {
        this.returnToPost();
      }
    }
  }

  returnToPost() {
    this.mode = this.patrol ? 'patrol' : 'idle';
    this.modeTime = 0;
    if (this.patrol) this.setFacing(this.x < (this.patrol[0] + this.patrol[1]) / 2 ? 1 : -1);
    else this.setFacing(this.cfg.facing ?? 1);
  }

  raiseAlarm(player, spread = true) {
    if (this.alerted || this.down) return;
    this.alerted = true;
    this.suspicion = 1;
    this.lastSeen = { x: player.x, y: player.y };
    this.lostTime = 0;
    state.data.stats.detections++;
    audio.sfx('alert');
    this.say(this.type.catcher ? 'FERMO! POLIZIA!' : ['Ehi, tu!', 'Eccolo!', 'Fermati!'][Math.floor(Math.random() * 3)]);
    if (this.type.catcher) {
      this.mode = 'idle';
      this.sprite.body.setVelocityX(0);
      this.setFacing(player.x - this.x);
      this.scene.events.emit('player-caught', this);
      return;
    }
    this.mode = 'chase';
    this.modeTime = 0;
    this.attackReadyAt = this.scene.time.now + 350;
    if (spread) this.scene.alertNearby?.(this, player, 520);
    this.scene.events.emit('enemy-alert', this);
  }

  calmDown() {
    this.alerted = false;
    this.suspicion = 0.4;
    if (this.lastSeen) this.investigate(this.lastSeen.x);
    else this.returnToPost();
    this.scene.events.emit('enemy-calm', this);
  }

  updateChase(time, player) {
    const body = this.sprite.body;
    const targetX = this.lastSeen ? (this.lostTime < 300 ? player.x : this.lastSeen.x) : player.x;
    // Spread out so a group does not stack on one pixel.
    let offset = 0;
    this.scene.enemies.forEach((other) => {
      if (other !== this && !other.down && Math.abs(other.x - this.x) < 34) offset += this.x < other.x ? -26 : 26;
    });
    const dx = targetX - this.x;
    this.setFacing(dx || this.facing);
    const near = Math.abs(player.x - this.x) < 60 && Math.abs(player.y - this.y) < 56 && !player.dead;
    if (near && time >= this.attackReadyAt) {
      this.mode = 'windup';
      this.modeTime = 0;
      this.attackReadyAt = time + 900 + Math.random() * 500;
      return;
    }
    if (Math.abs(dx) > 48) {
      body.setVelocityX(Math.sign(dx) * this.type.chase + offset);
      this.anim('walk');
      // Hop small obstacles.
      if ((body.blocked.left || body.blocked.right) && body.blocked.down) body.setVelocityY(-620);
    } else {
      body.setVelocityX(offset);
      this.anim('idle');
    }
  }

  updateOverlay() {
    const eye = this.eye();
    const alertColor = this.alerted ? 0xff4a3a : this.suspicion > 0.05 ? 0xffd070 : (this.type.flashlight ? 0xfff0c0 : 0xe8d8a0);
    const range = this.type.range * (this.scene.fx.darkness && !this.type.flashlight ? 0.55 : 1);
    this.cone.setVisible(true).setPosition(eye.x, eye.y).setOrigin(this.facing > 0 ? 0 : 1, 0.5)
      .setFlipX(this.facing < 0).setDisplaySize(range, range * 0.42).setTint(alertColor);
    if (this.type.flashlight && this.scene.fx.darkness) this.scene.fx.cut(eye.x + this.facing * range * 0.45, eye.y + 10, range * 0.45, 0.8);

    const showMark = this.alerted || this.suspicion > 0.05;
    this.mark.setVisible(showMark).setPosition(this.x, this.y - 64);
    this.mark.setTexture(this.alerted ? 'mark-ex' : 'mark-q');
    this.meter.setVisible(!this.alerted && this.suspicion > 0.05).setPosition(this.x, this.y - 46);
    this.meter.width = 30 * this.suspicion;
  }

  say(line) {
    const t = this.scene.add.text(this.x, this.y - 88, line, {
      fontFamily: FONT, fontStyle: 'bold', fontSize: '13px', color: '#f0d0c0',
      backgroundColor: '#0d0a0bcc', padding: { x: 6, y: 3 }
    }).setOrigin(0.5).setDepth(DEPTH.npc + 6);
    this.scene.tweens.add({ targets: t, y: t.y - 16, alpha: 0, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  // ----------------------------------------------------------- damage

  takeHit(hit, player) {
    if (this.down) return false;
    this.hp -= hit.damage;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.mode !== 'windup') this.sprite.clearTint(); });
    this.sprite.body.setVelocity(hit.dir * hit.knock, hit.heavy ? -220 : -60);
    this.setFacing(-hit.dir);
    if (!this.alerted) this.raiseAlarm(player);
    if (this.hp <= 0) {
      this.knockout(hit.dir);
      return true;
    }
    this.mode = 'hurt';
    this.modeTime = 0;
    this.attackReadyAt = Math.max(this.attackReadyAt, this.scene.time.now + 500);
    return true;
  }

  canBeTakenDown(player) {
    if (this.down || this.alerted || this.type.noTakedown) return false;
    const behind = (player.x - this.x) * this.facing < 0;
    const dist = Math.abs(player.x - this.x);
    return behind && dist < 64 && Math.abs(player.y - this.y) < 50;
  }

  takedown(player) {
    this.scene.fx.hitStop(90);
    audio.sfx('takedown');
    this.scene.fx.shake(120, 0.006);
    this.setFacing(player.x - this.x);
    state.data.stats.takedowns++;
    this.knockout(player.facing, true);
  }

  knockout(dir, silent = false) {
    this.mode = 'down';
    this.modeTime = 0;
    this.alerted = false;
    this.sprite.clearTint();
    this.sprite.anims.stop();
    this.sprite.setFrame(28);
    this.scene.time.delayedCall(220, () => this.sprite.setFrame(29));
    this.sprite.body.setVelocityX(dir * (silent ? 40 : 220));
    this.sprite.setDepth(DEPTH.npc - 2);
    if (!silent) audio.sfx('ko');
    state.data.stats.kos++;
    const [min, max] = this.type.lira;
    if (max > 0 && !this.cfg.noLoot) {
      this.scene.time.delayedCall(300, () => this.scene.spawnMoney?.(this.x, this.y + 10, Math.round(Phaser.Math.Between(min, max) / 100) * 100));
    }
    this.scene.events.emit('enemy-down', this);
  }

  // Removes the enemy from play without destroying objects colliders use.
  retire() {
    this.mode = 'down';
    this.retired = true;
    [this.sprite, this.cone, this.mark, this.meter, this.shadow].forEach((o) => o.setVisible(false));
    this.sprite.body.enable = false;
  }
}

// ======================================================================
// Commissario Vitale: keeps his distance and fires telegraphed shots.
// Crouch behind cover or dodge through the shot; rush him while he reloads.

export class Vitale extends Enemy {
  constructor(scene, cfg) {
    super(scene, { ...cfg, type: 'thug2' });
    this.sheet = 'vitale';
    this.sprite.setTexture('vitale-sheet', 0);
    this.sprite.play('vitale-idle');
    this.hp = cfg.hp ?? 180;
    this.maxHp = this.hp;
    this.type = { ...this.type, noTakedown: true, lira: [0, 0], chase: 170 };
    this.mode = 'dormant';
    this.shots = 0;
    this.phase = 1;
    this.cone.setVisible(false);
    this.laser = scene.add.graphics().setDepth(DEPTH.player + 4);
    this.tracer = scene.add.graphics().setDepth(DEPTH.player + 4);
    this.hitStreak = 0;
  }

  activate() {
    this.mode = 'reposition';
    this.modeTime = 0;
    this.alerted = true;
  }

  gun() {
    return { x: this.x + this.facing * 26, y: this.y - 10 };
  }

  target(player) {
    const body = player.body;
    return { x: player.x, y: player.isCrouching ? body.center.y + 2 : body.top + 14 };
  }

  update(time, delta, player) {
    const body = this.sprite.body;
    this.modeTime += delta;
    this.shadow.setPosition(this.x, body.bottom - 1);
    this.cone.setVisible(false);
    this.mark.setVisible(false);
    this.meter.setVisible(false);
    this.laser.clear();
    if (this.mode === 'dormant' || this.mode === 'down') {
      body.setVelocityX(0);
      if (this.mode === 'dormant') this.anim('idle');
      return;
    }
    const aimTime = this.phase === 1 ? 1050 : 720;
    const dx = player.x - this.x;
    const dist = Math.abs(dx);

    switch (this.mode) {
      case 'reposition': {
        this.setFacing(dx);
        const ideal = this.phase === 1 ? 380 : 300;
        if (dist < 90 && !player.dead) { this.startWhip(); break; }
        if (dist < ideal - 80) {
          body.setVelocityX(-Math.sign(dx) * 170);
          this.sprite.play('vitale-walk', true);
          this.sprite.setFlipX(dx < 0);
        } else if (dist > ideal + 140) {
          body.setVelocityX(Math.sign(dx) * 170);
          this.anim('walk');
        } else {
          body.setVelocityX(0);
          this.anim('idle');
        }
        if (this.modeTime > 700) { this.mode = 'aim'; this.modeTime = 0; audio.sfx('aim'); }
        break;
      }
      case 'aim': {
        body.setVelocityX(0);
        this.setFacing(dx);
        this.sprite.anims.stop();
        this.sprite.setFrame(30);
        if (this.modeTime < aimTime - 240 || !this.locked) {
          if (this.modeTime < aimTime - 240) this.locked = null;
          else this.locked = this.target(player);
        }
        const g = this.gun();
        const t = this.locked || this.target(player);
        const blink = this.locked && Math.floor(this.modeTime / 50) % 2;
        this.laser.lineStyle(2, blink ? 0xffffff : 0xff3030, this.locked ? 0.9 : 0.5);
        this.laser.lineBetween(g.x, g.y, g.x + (t.x - g.x) * 3, g.y + (t.y - g.y) * 3);
        if (dist < 80) { this.locked = null; this.startWhip(); break; }
        if (this.modeTime >= aimTime) this.fire(player);
        break;
      }
      case 'fire':
        body.setVelocityX(0);
        if (this.modeTime > 260) {
          this.sprite.setFrame(30);
          if (this.shots >= (this.phase === 1 ? 3 : 4)) {
            this.mode = 'reload';
            this.modeTime = 0;
            this.shots = 0;
            audio.sfx('reload');
            this.say('Merda... caricatore!');
          } else {
            this.mode = 'reposition';
            this.modeTime = 300;
          }
        }
        break;
      case 'reload':
        body.setVelocityX(0);
        this.anim('idle');
        this.sprite.setTint(0xb0b0b0);
        if (this.modeTime > (this.phase === 1 ? 2000 : 1500)) {
          this.sprite.clearTint();
          audio.sfx('reload');
          this.mode = 'reposition';
          this.modeTime = 0;
        }
        break;
      case 'whipWindup':
        body.setVelocityX(0);
        this.sprite.anims.stop();
        this.sprite.setFrame(22);
        this.sprite.setTintFill(Math.floor(this.modeTime / 60) % 2 ? 0xffffff : 0xffd0a0);
        if (this.modeTime > 320) {
          this.sprite.clearTint();
          this.sprite.setFrame(24);
          audio.sfx('whoosh');
          const reach = (player.x - this.x) * this.facing;
          if (reach > -10 && reach < 80 && Math.abs(player.y - this.y) < 56) {
            if (player.damage(16, this.x, 380)) audio.sfx('heavy');
          }
          this.mode = 'hop';
          this.modeTime = 0;
        }
        break;
      case 'hop':
        if (this.modeTime < 30) body.setVelocity(-this.facing * 420, -420);
        if (this.modeTime > 450 && (body.blocked.down || body.touching.down)) { this.mode = 'reposition'; this.modeTime = 0; }
        break;
      case 'hurt':
        body.setVelocityX(body.velocity.x * 0.9);
        this.sprite.anims.stop();
        this.sprite.setFrame(26);
        if (this.modeTime > 240) {
          this.sprite.clearTint();
          if (this.hitStreak >= 3) { this.hitStreak = 0; this.mode = 'hop'; this.modeTime = 0; this.setFacing(player.x - this.x); }
          else { this.mode = this.resume || 'reposition'; this.modeTime = 0; }
        }
        break;
      default: break;
    }
  }

  startWhip() {
    this.mode = 'whipWindup';
    this.modeTime = 0;
  }

  fire(player) {
    const g = this.gun();
    const t = this.locked || this.target(player);
    this.locked = null;
    this.mode = 'fire';
    this.modeTime = 0;
    this.shots++;
    this.sprite.setFrame(31);
    audio.sfx('gun');
    this.scene.fx.shake(120, 0.01);
    const flash = this.scene.add.image(g.x, g.y, 'glow').setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(90, 90).setDepth(DEPTH.player + 5);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 120, onComplete: () => flash.destroy() });

    // Hitscan along the locked line. Cover and dodging both beat it.
    const far = { x: g.x + (t.x - g.x) * 4, y: g.y + (t.y - g.y) * 4 };
    const blockAt = this.scene.firstBlock?.(g.x, g.y, far.x, far.y);
    const pBody = player.body;
    const line = new Phaser.Geom.Line(g.x, g.y, far.x, far.y);
    const pRect = new Phaser.Geom.Rectangle(pBody.x, pBody.y, pBody.width, pBody.height);
    const hitsPlayer = Phaser.Geom.Intersects.LineToRectangle(line, pRect);
    const playerDist = Math.hypot(player.x - g.x, player.y - g.y);
    let end = far;
    if (blockAt && blockAt.dist < playerDist) {
      end = blockAt.point;
      this.scene.fx.hitSpark(end.x, end.y, 10);
      audio.sfx('block');
    } else if (hitsPlayer && player.damage(22, this.x, 300)) {
      end = { x: player.x, y: t.y };
      audio.sfx('hit');
    } else if (hitsPlayer) {
      this.scene.hud?.toast('Kıl payı!', '#e8c14a');
    }
    this.tracer.clear();
    this.tracer.lineStyle(2, 0xffe9b8, 0.9);
    this.tracer.lineBetween(g.x, g.y, end.x, end.y);
    this.scene.tweens.addCounter({
      from: 1, to: 0, duration: 120,
      onUpdate: (tw) => { this.tracer.setAlpha(tw.getValue()); },
      onComplete: () => this.tracer.clear()
    });
  }

  takeHit(hit) {
    if (this.mode === 'down' || this.mode === 'dormant') return false;
    this.hp -= hit.damage * (this.mode === 'reload' ? 1.5 : 1);
    this.hitStreak++;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.sprite.clearTint());
    this.sprite.body.setVelocityX(hit.dir * hit.knock * 0.6);
    this.locked = null;
    if (this.hp <= this.maxHp / 2 && this.phase === 1) {
      this.phase = 2;
      this.say('Basta! Ti ammazzo!');
      this.scene.events.emit('boss-phase', 2);
    }
    if (this.hp <= 0) {
      this.mode = 'down';
      this.sprite.anims.stop();
      this.sprite.setFrame(28);
      this.laser.clear();
      audio.sfx('ko');
      this.scene.events.emit('boss-defeated', this);
      return true;
    }
    this.resume = this.mode === 'reload' ? 'reload' : 'reposition';
    this.mode = 'hurt';
    this.modeTime = 0;
    return true;
  }

}
