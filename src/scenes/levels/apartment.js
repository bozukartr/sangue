// Casa Bianchi: the family flat and Gianlico's safe house. The bed restores
// health and saves; the coat and desk hold Capitolo II's clues.
import { GAME_W, GAME_H, GROUND_TOP, DEPTH } from '../../config.js';
import { state } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { STAGE } from '../../story.js';
import { PX } from '../../gfx/textures.js';
import { WorldScene } from '../world.js';

const DOOR_X = 112;
const COAT_X = 330;
const WARDROBE_X = 500;
const DESK_X = 760;
const RADIO_X = 900;
const BED_X = 1080;

export class ApartmentScene extends WorldScene {
  constructor() { super('apartment'); }

  levelConfig() {
    return {
      width: GAME_W,
      ground: 'tile-wood',
      background: '#201b1d',
      music: 'interior',
      ambience: { rain: 0.45, room: 0.5 },
      location: ['CASA BIANCHI', 'TRASTEVERE · TERZO PIANO'],
      vignette: 0.65,
      hint: 'E incele · Yatak: dinlen ve kaydet · TAB günlük'
    };
  }

  spawnX() { return DOOR_X + 80; }

  buildLevel() {
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x272225).setDepth(DEPTH.sky);
    this.add.rectangle(GAME_W / 2, 392, GAME_W, 500, 0x403437).setDepth(DEPTH.sky);
    for (let x = 0; x < GAME_W; x += 32) this.add.rectangle(x, 300, 1, 220, 0x3a2e31, 0.7).setDepth(DEPTH.sky);
    this.add.rectangle(GAME_W / 2, 411, GAME_W, 8, 0x574548).setDepth(DEPTH.far);
    this.add.rectangle(GAME_W / 2, 530, GAME_W, 230, 0x352a2c).setDepth(DEPTH.far);
    this.add.rectangle(GAME_W / 2, 204, GAME_W, 9, 0x30282a).setDepth(DEPTH.far);
    this.add.rectangle(GAME_W / 2, 60, GAME_W, 120, 0x1e191b).setDepth(DEPTH.far);

    // Window to the rainy street.
    const wx = 1094;
    this.add.rectangle(wx, 330, 232, 244, 0x171d27).setDepth(DEPTH.back);
    this.add.rectangle(wx, 330, 202, 214, 0x303b4b).setDepth(DEPTH.back);
    this.rainLines = [];
    for (let i = 0; i < 18; i++) {
      this.rainLines.push(this.add.rectangle(1000 + (i * 37) % 185, 240 + (i * 53) % 175, 2, 18, 0xb1b5bf, 0.2).setDepth(DEPTH.back));
    }
    this.add.rectangle(wx, 330, 8, 244, 0x6b5450).setDepth(DEPTH.back + 1);
    this.add.rectangle(wx, 330, 232, 7, 0x6b5450).setDepth(DEPTH.back + 1);
    this.add.rectangle(988, 345, 18, 254, 0x4e3239).setDepth(DEPTH.back + 1);
    this.add.rectangle(1200, 345, 18, 254, 0x4e3239).setDepth(DEPTH.back + 1);
    this.fx.glow(wx, 330, 200, 0x6080b0, 0.15, { depth: DEPTH.back + 2, cut: false });

    // Door.
    this.add.rectangle(DOOR_X, 568, 110, 148, 0x191719).setDepth(DEPTH.back);
    this.add.rectangle(DOOR_X, 571, 96, 136, 0x59413c).setDepth(DEPTH.back);
    this.add.rectangle(DOOR_X + 30, 574, 5, 5, 0xb99a58).setDepth(DEPTH.back);
    this.sign(DOOR_X, 480, 'USCITA', { size: '11px', bg: '#191719' });

    // Family wall: photos and a crucifix.
    this.add.image(250, 270, 'painting').setScale(PX).setDepth(DEPTH.back);
    this.add.image(600, 250, 'painting').setScale(PX * 0.8).setDepth(DEPTH.back);
    this.add.image(430, 240, 'crucifix').setScale(PX).setDepth(DEPTH.back);

    // Father's coat on the rack.
    this.add.rectangle(COAT_X, 540, 12, 205, 0x6c5142).setDepth(DEPTH.props);
    this.add.rectangle(COAT_X, 449, 96, 8, 0x775c49).setDepth(DEPTH.props);
    this.add.rectangle(COAT_X, 533, 62, 116, 0x282a2c).setDepth(DEPTH.props);
    this.add.rectangle(COAT_X - 20, 529, 20, 100, 0x38383a).setDepth(DEPTH.props);
    this.add.rectangle(COAT_X + 20, 529, 20, 100, 0x38383a).setDepth(DEPTH.props);
    this.add.rectangle(COAT_X, 587, 65, 8, 0x1d1d20).setDepth(DEPTH.props);

    this.add.image(WARDROBE_X, GROUND_TOP, 'wardrobe').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);

    // Desk with lamp and typewriter.
    this.add.image(DESK_X, GROUND_TOP, 'desk').setOrigin(0.5, 1).setScale(PX * 1.1).setDepth(DEPTH.props);
    this.add.image(DESK_X - 40, GROUND_TOP - 48, 'desk-lamp').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props + 1);
    this.add.image(DESK_X + 30, GROUND_TOP - 48, 'typewriter').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props + 1);
    this.add.image(DESK_X - 5, GROUND_TOP - 48, 'papers').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props + 1);
    this.fx.glow(DESK_X - 40, GROUND_TOP - 70, 140, 0xf3c47a, 0.35, { depth: DEPTH.props + 2, flicker: true, cut: false });

    // Radio on a side table.
    this.add.rectangle(RADIO_X, 620, 50, 44, 0x3a2820).setDepth(DEPTH.props);
    this.add.rectangle(RADIO_X, 588, 40, 22, 0x5a3a28).setDepth(DEPTH.props);
    this.add.rectangle(RADIO_X - 8, 588, 16, 12, 0xd9a55a, 0.6).setDepth(DEPTH.props);
    this.add.circle(RADIO_X + 11, 588, 4, 0x2a1d17).setDepth(DEPTH.props);

    this.add.image(BED_X, GROUND_TOP, 'bed').setOrigin(0.5, 1).setScale(PX * 1.2).setDepth(DEPTH.props);

    this.addExit(DOOR_X, 'Sokağa çık', 'rome', 'home');
    this.addInteract({ x: COAT_X, range: 70, label: 'Babanın paltosu', action: () => this.inspectCoat() });
    this.addInteract({ x: DESK_X, range: 80, label: 'Çalışma masası', action: () => this.inspectDesk() });
    this.addInteract({ x: RADIO_X, range: 50, label: 'Radyoyu aç', action: () => this.radio() });
    this.addInteract({ x: BED_X, range: 100, label: 'Dinlen · kaydet', action: () => this.rest() });

    this.addPickup({
      x: WARDROBE_X, memento: 'report',
      lines: [
        ['GIANLICO', 'Dolabın alt çekmecesinde bir zarf. İçinde… benim karnem. 1972.'],
        ['GIANLICO', 'Kenarına babamın el yazısıyla not düşülmüş: “Benden iyisi olacak.”'],
        ['GIANLICO', 'Bunu hiç göstermedi. Ben de hiç sormadım.']
      ]
    });
  }

  onReady() {
    if (state.stage === STAGE.GO_HOME) {
      state.stage = STAGE.SEARCH_COAT;
      this.hud.refresh();
      this.time.delayedCall(2400, () => this.say([['GIANLICO', 'Her şey bıraktığı gibi. Paltosu hâlâ askıda.']]));
    }
  }

  levelUpdate(_t, delta) {
    this.rainLines.forEach((r) => {
      r.y += delta * 0.35;
      if (r.y > 430) r.y = 232;
    });
  }

  async inspectCoat() {
    if (state.stage !== STAGE.SEARCH_COAT) {
      await this.say([['GIANLICO', state.hasEvidence('key31')
        ? 'Astarındaki gizli dikişi artık biliyorum. Hâlâ onun kokusu var.'
        : 'Babamın paltosu. Cenazeden önceki akşam bunu giymişti.']]);
      return;
    }
    await this.say([
      ['GIANLICO', 'Babam bu paltoyu cenazeden önceki akşam giymişti.'],
      ['GIANLICO', 'Astarın içinde bir sertlik var… dikiş sonradan atılmış. Küçük bir anahtar. Pirinç etikette yalnızca 31 yazıyor.'],
      ['GIANLICO', 'Bunu benden sakladıysa bir sebebi olmalı.']
    ]);
    this.giveEvidence('key31');
    await this.setStage(STAGE.SEARCH_DESK);
  }

  async inspectDesk() {
    if (state.stage < STAGE.SEARCH_DESK) {
      await this.say([['GIANLICO', state.stage === STAGE.SEARCH_COAT
        ? 'Önce babamın paltosuna bakmalıyım.'
        : 'Babamın masası. Daktilo hâlâ yarım bir faturayı tutuyor.']]);
      return;
    }
    if (state.stage > STAGE.SEARCH_DESK) {
      await this.say([['GIANLICO', 'Fotoğraftaki üç kişi hâlâ aynı yerde: babam, Borge ve Cranier. Üçü de gülüyor.']]);
      return;
    }
    await this.say([
      ['GIANLICO', 'Çekmecede eski bir fotoğraf. Babam, Borge ve Cranier aynı masada. Düşman olmadan önce tanışıyorlarmış.'],
      ['GIANLICO', 'Arkasına bir isim yazmış: Elena Bellini. Yanında da “Trastevere durağı”.'],
      ['GIANLICO', 'Borge bana fotoğraftan söz etmedi. Elena hâlâ oradaysa o geceyi anlatabilir.']
    ]);
    this.giveEvidence('photo');
    await this.setStage(STAGE.MEET_ELENA);
  }

  async radio() {
    audio.sfx('switch');
    const s = state.stage;
    let line;
    if (s < STAGE.GO_HOME) line = '…Roma’da yağış hafta sonuna kadar sürecek. Tevere’nin seviyesi…';
    else if (s < STAGE.TRAVEL_PORT) line = '…Trastevere’de geçen hafta ölü bulunan Paolo Bianchi’nin ölümü polis tarafından kaza olarak kaydedildi…';
    else if (s < STAGE.CONFRONT_BORGE) line = '…Civitavecchia limanında gümrük denetimleri sıkılaştırılıyor. Liman idaresi herhangi bir usulsüzlüğü reddetti…';
    else if (s < STAGE.SHOW_STATEMENT) line = '…Commissario Renzo Vitale, organize suçla mücadelede “Roma’nın temiz yüzü” olarak ödüllendirildi…';
    else if (s < STAGE.COMPLETE) line = '…Questura’daki gece hırsızlığına ilişkin açıklama yapılmadı. Tanıklara göre olay yerinden iki araç hızla ayrıldı…';
    else line = state.data.ending === 'verita'
      ? '…Giudice Ferri, Monte Cranier ve Commissario Vitale hakkında tutuklama kararı verdi. Soruşturma derinleşiyor…'
      : '…Monte Mario’daki silahlı saldırının faili bulunamadı. Polis “iç hesaplaşma” diyor…';
    await this.say([['RADYO', line]]);
  }

  async rest() {
    const d = state.data;
    const pick = await this.choose('GIANLICO', 'Yatak. Birkaç saat uyku.', ['Dinlen ve kaydet', 'Vazgeç']);
    if (pick !== 0) return;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    await this.wait(900);
    d.health = d.maxHealth;
    audio.sfx('heal');
    this.checkpoint();
    this.hud.refresh(true);
    this.cameras.main.fadeIn(900, 0, 0, 0);
    await this.wait(500);
    await this.say([[
      'GIANLICO', Phaser.Utils.Array.GetRandom([
        'Rüyamda babam durağın altında bekliyordu. Otobüs hiç gelmedi.',
        'Yağmur sesine uyandım. Bir an her şeyin rüya olduğunu sandım.',
        'Uyuyamadım. Ama gözlerimi kapatmak bile iyi geldi.'
      ])
    ]]);
  }
}
