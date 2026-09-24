// Bar Arisel: Borge's back table, Tonino's counter (shop) and the jukebox.
// Most of the story's turning points are argued out here.
import { GAME_W, GAME_H, GROUND_TOP, DEPTH, HEX } from '../../config.js';
import { state, ITEMS, formatLira } from '../../core/state.js';
import { audio } from '../../core/audio.js';
import { STAGE } from '../../story.js';
import { PX } from '../../gfx/textures.js';
import { WorldScene } from '../world.js';

const DOOR_X = 90;
const TONINO_X = 470;
const BORGE_X = 1060;

export class BarScene extends WorldScene {
  constructor() { super('bar'); }

  levelConfig() {
    return {
      width: GAME_W,
      ground: 'tile-wood',
      background: '#1d1517',
      music: state.flag('jukeboxOff') ? 'interior' : 'interior',
      ambience: { rain: 0.25, room: 0.6 },
      location: ['BAR ARISEL', 'TRASTEVERE · DAL 1954'],
      vignette: 0.6,
      hint: 'E konuş · Tonino’dan alışveriş · TAB günlük'
    };
  }

  spawnX() { return DOOR_X + 70; }

  buildLevel() {
    // Walls: wainscot, faded wallpaper, photos.
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x2a1f20).setDepth(DEPTH.sky);
    this.add.rectangle(GAME_W / 2, 250, GAME_W, 380, 0x3d2a26).setDepth(DEPTH.sky);
    for (let x = 0; x < GAME_W; x += 40) this.add.rectangle(x, 250, 2, 380, 0x352420, 0.8).setDepth(DEPTH.sky);
    this.add.rectangle(GAME_W / 2, 530, GAME_W, 224, 0x2a1d17).setDepth(DEPTH.far);
    this.add.rectangle(GAME_W / 2, 420, GAME_W, 8, 0x6b4b36).setDepth(DEPTH.far);
    for (let x = 20; x < GAME_W; x += 60) this.add.rectangle(x, 530, 44, 180, 0x33241c).setDepth(DEPTH.far);
    this.add.rectangle(GAME_W / 2, 64, GAME_W, 10, 0x1a1212).setDepth(DEPTH.far);

    // Door and window to the rainy street.
    this.add.rectangle(DOOR_X, 570, 110, 150, 0x141012).setDepth(DEPTH.back);
    this.add.rectangle(DOOR_X, 574, 96, 138, 0x283040).setDepth(DEPTH.back);
    for (let i = 0; i < 10; i++) this.add.rectangle(DOOR_X - 40 + i * 9, 540 + (i * 37) % 60, 1, 14, 0xb8c4d0, 0.25).setDepth(DEPTH.back);
    this.sign(DOOR_X, 476, 'USCITA', { size: '11px', bg: '#1a1212' });

    // Bottle shelf, espresso machine, counter.
    this.add.image(TONINO_X, 360, 'bottles').setScale(PX * 1.2).setDepth(DEPTH.back);
    this.fx.glow(TONINO_X, 360, 200, 0xe0a050, 0.18, { depth: DEPTH.back + 1, cut: false });
    this.add.image(TONINO_X, GROUND_TOP + 2, 'counter').setOrigin(0.5, 1).setScale(PX * 1.1).setDepth(DEPTH.npc + 2);
    this.add.image(TONINO_X + 70, GROUND_TOP - 64, 'espresso-machine').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.npc + 3);
    this.sign(TONINO_X, 250, 'CAFFÈ · PANINI · GRAPPA', { size: '13px', color: '#e0b060', bg: '#1d1214' });

    // Framed photos: Borge's life in pictures.
    [[700, 230], [770, 250], [840, 226]].forEach(([x, y]) => this.add.image(x, y, 'painting').setScale(PX).setDepth(DEPTH.back));
    this.add.image(930, 240, 'crucifix').setScale(PX).setDepth(DEPTH.back);

    // Jukebox.
    this.add.image(720, GROUND_TOP, 'jukebox').setOrigin(0.5, 1).setScale(PX).setDepth(DEPTH.props);
    this.jukeGlow = this.fx.glow(720, 590, 90, 0xe0a050, 0.35, { depth: DEPTH.props + 1, flicker: true, cut: false });

    // Borge's back table.
    this.add.image(BORGE_X + 70, GROUND_TOP, 'table').setOrigin(0.5, 1).setScale(PX * 1.2).setDepth(DEPTH.npc + 2);
    this.add.image(BORGE_X + 120, GROUND_TOP, 'chair').setOrigin(0.5, 1).setScale(PX).setFlipX(true).setDepth(DEPTH.npc + 1);
    this.add.image(BORGE_X + 70, 250, 'chandelier').setScale(PX).setDepth(DEPTH.back);
    this.fx.glow(BORGE_X + 70, 290, 220, 0xf0c070, 0.25, { depth: DEPTH.back + 2, cut: false });
    this.add.rectangle(1230, 560, 60, 170, 0x1a1212).setDepth(DEPTH.back);
    this.add.rectangle(1230, 560, 50, 160, 0x3a2820).setDepth(DEPTH.back);
    this.sign(1230, 460, 'PRIVATO', { size: '11px', bg: '#1a1212' });

    this.addPickup({
      x: BORGE_X + 90, y: GROUND_TOP - 42, memento: 'tavla', texture: 'sparkle',
      lines: [
        ['GIANLICO', 'Tavla tahtası hâlâ masada. Siyah pullardan biri eksik… hayır, burada, masanın kenarında.'],
        ['GIANLICO', 'Babam hep siyahla oynardı. “Beyaz önden başlar, siyah sonunda kazanır” derdi.']
      ]
    });

    // People.
    this.tonino = this.addNpc('tonino', TONINO_X, { name: 'TONINO', color: '#e0b080' });
    this.borge = this.addNpc('borge', BORGE_X, { name: 'BORGE', color: HEX.gold });
    this.addNpc('patron', 820, { facing: -1 });
    this.addNpc('thug2', 250, { facing: 1 }).sprite.setTint(0xb0a0a0);

    this.addExit(DOOR_X, 'Sokağa çık', 'rome', 'bar');
    this.addInteract({ x: TONINO_X, range: 90, label: 'Tonino · alışveriş', action: () => this.shop() });
    this.addInteract({ x: BORGE_X, range: 90, label: 'Borge ile konuş', action: () => this.talkBorge() });
    this.addInteract({
      x: 720, range: 50, label: 'Müzik kutusu',
      action: async () => {
        const off = !state.flag('jukeboxOff');
        state.setFlag('jukeboxOff', off);
        audio.sfx('switch');
        this.baseMusic = off ? 'sorrow' : 'interior';
        this.jukeGlow.img.setAlpha(off ? 0.12 : 0.35);
        this.hud.toast(off ? '♪ “Arrivederci Roma”' : '♪ Bar radyosu', HEX.mute);
      }
    });
    this.addInteract({
      x: 1230, range: 50, label: 'Arka oda',
      action: () => this.say([['GIANLICO', state.data.ending === 'sangue'
        ? 'Arka oda artık benim. Sandalye hâlâ sıcak.'
        : 'Kilitli. Borge’un “ofisi”. Babam buraya hiç girmezdi.']])
    });
  }

  onReady() {
    if (state.flag('jukeboxOff')) this.baseMusic = 'sorrow';
    if (state.stage === STAGE.FIND_BORGE) {
      this.time.delayedCall(700, () => this.hud.toast('Borge arka masada', HEX.gold));
    }
  }

  async shop() {
    const d = state.data;
    await this.dialogue.run(async () => {
      await this.say([[
        'TONINO', state.stage === STAGE.FIND_BORGE
          ? 'Gianlico… başın sağ olsun. Borge arkada, seni bekliyor. İlk kahve benden.'
          : Phaser.Utils.Array.GetRandom([
            'Ne alırsın? Kahve taze, panino bugünkü.',
            'Yüzün kötü görünüyor. Otur, bir şey ye.',
            'Baban her sabah burada bir ristretto içerdi. Ayakta.'
          ])
      ]]);
      if (state.stage === STAGE.FIND_BORGE && !state.flag('toninoGift')) {
        state.setFlag('toninoGift');
        state.addItem('espresso', 1);
        this.hud.toast('Espresso ×1', HEX.cream, 'icon-espresso');
        this.hud.refresh();
      }
      for (;;) {
        const pe = state.price(ITEMS.espresso.price);
        const pp = state.price(ITEMS.panino.price);
        const pick = await this.choose('TONINO', `Cüzdan: ${formatLira(d.money)}${state.data.rep >= 70 ? '  ·  mahalle fiyatı' : ''}`, [
          { label: `Espresso  +${ITEMS.espresso.heal} can  ·  ${formatLira(pe)}  (${d.items.espresso})`, disabled: d.money < pe },
          { label: `Panino  +${ITEMS.panino.heal} can  ·  ${formatLira(pp)}  (${d.items.panino})`, disabled: d.money < pp },
          'Yeter, sağ ol'
        ]);
        if (pick === 2) break;
        const id = pick === 0 ? 'espresso' : 'panino';
        this.addMoney(-(pick === 0 ? pe : pp));
        state.addItem(id, 1);
        this.hud.refresh();
      }
    });
  }

  async talkBorge() {
    const s = state.stage;
    const d = state.data;
    await this.dialogue.run(async () => {
      if (s === STAGE.FIND_BORGE) {
        await this.say([
          ['BORGE', 'Gianlico. Otur. Kahveni Tonino getirir.'],
          ['GIANLICO', 'Cenazede herkes Cranier’in adını söyledi. Sen neden söylemedin?']
        ]);
        const pick = await this.choose('GIANLICO', 'Borge sana bakıyor. Sakin, yorgun.', [
          'Sakin kal: “Ne bildiğini anlat.”',
          'Masaya vur: “Cranier’in adını söyle!”'
        ]);
        if (pick === 0) {
          this.addRep(3);
          await this.say([['BORGE', 'Babanın oğlusun. O da önce dinlerdi.']]);
        } else {
          this.addRep(-3);
          await this.say([['BORGE', 'Bağırarak kimseyi bulamazsın. Sadece kimin duyduğunu öğrenirsin.']]);
        }
        await this.say([
          ['BORGE', 'Cenazede konuşmak kolay. Babanın ölümüne dair elimizde yalnızca eksik bir hesap var.'],
          ['BORGE', 'Magazzino 17’de kırmızı bir defter duruyor. Babanın hesap defteri. Onu getir.'],
          ['BORGE', 'Önünde Cranier’in adamları dolaşıyor. Kavga etmek zorunda değilsin; gölgede kal.'],
          ['BORGE', 'Al. Yol parası. Tonino’dan bir şey ye, sonra git.']
        ]);
        this.addMoney(4000);
        await this.setStage(STAGE.FIND_LEDGER);
      } else if (s === STAGE.FIND_LEDGER) {
        await this.say([['BORGE', 'Defter olmadan birini suçlayamam. Sen de suçlama, Gianlico.']]);
      } else if (s === STAGE.RETURN_LEDGER) {
        await this.say([
          ['GIANLICO', 'Son sayfada babamın işareti var. Ölmeden iki gün önce, 31 numaralı bir kayıt.'],
          ['BORGE', 'Ödeme yazmıyor. Yalnızca teslimat. O hafta babanı görmedim; ne taşıdığını bilmiyorum.'],
          ['GIANLICO', 'Bana şimdi mi söylüyorsun?'],
          ['BORGE', 'Bildiğim her şeyi söylediğime inanmanı beklemiyorum. Evine git; bıraktığı şeylere bak.'],
          ['BORGE', 'Şunu da al. Babanın son maaşı. Bende kalmıştı.']
        ]);
        this.addMoney(8000);
        await this.setStage(STAGE.GO_HOME);
      } else if (s >= STAGE.GO_HOME && s <= STAGE.MEET_ELENA) {
        await this.say([['BORGE', s === STAGE.MEET_ELENA
          ? 'Evde bir isim bulduysan onunla konuş. Benim anlattıklarıma güvenmek zorunda değilsin.'
          : 'Babanın eşyalarına bak, Gianlico. Sonra konuşuruz.']]);
      } else if (s === STAGE.QUESTION_BORGE) {
        await this.say([
          ['GIANLICO', 'Elena sizi o gece babamla gördü. Bana görüşmediğinizi söylemiştin.'],
          ['BORGE', '…Evet, yanındaydım. Yalan söyledim. Peşine düşeceğinden korktum.']
        ]);
        const pick = await this.choose('GIANLICO', 'Borge gözlerini kaçırmıyor.', [
          '“Onu korudun mu, yoksa kendini mi?”',
          'Yakasına yapış: “Yalanın bir bedeli var!”'
        ]);
        if (pick === 0) {
          this.addRep(4);
          await this.say([['BORGE', 'İkisi de. Bu yaşta insan ikisini ayıramıyor.']]);
        } else {
          this.addRep(-5);
          await this.say([
            ['BORGE', 'Bırak. …Bırak dedim.'],
            ['BORGE', 'Babanın bedelini ben de ödüyorum, ragazzo. Her gece.']
          ]);
        }
        await this.say([['BORGE', 'Buna sözümle karar verme. Paltodaki anahtar 31 numaralı dolabı açar. Magazzino 17’de. İçindekiler ikimizi de suçlayabilir.']]);
        await this.setStage(STAGE.OPEN_CABINET);
      } else if (s === STAGE.OPEN_CABINET) {
        await this.say([['BORGE', '31 numaralı dolap hâlâ Magazzino 17’de. Gerçeği istiyorsan önce oraya bak.']]);
      } else if (s === STAGE.SHOW_MANIFEST) {
        await this.showManifest();
      } else if (s === STAGE.TRAVEL_PORT || s === STAGE.INFILTRATE_PORT) {
        await this.say([['BORGE', 'Civitavecchia’da Nico’yu bul. Liman ofisinin kaydı. Elena’nın durağından gece hattı var.']]);
      } else if (s === STAGE.ASK_ELENA_CAR) {
        await this.say([['BORGE', 'Alfetta mı? …Önce Elena’ya sor. O gece arabayı gören oydu, ben değil.']]);
      } else if (s === STAGE.CONFRONT_BORGE) {
        await this.revealVitale();
      } else if (s === STAGE.INFILTRATE_QUESTURA || s === STAGE.ESCAPE_QUESTURA) {
        await this.say([['BORGE', 'Questura, arşiv katı, Vitale’nin ofisi. Işıkları kes, gölgede kal. Polise el kaldırırsan hepimiz yanarız.']]);
      } else if (s === STAGE.SHOW_STATEMENT) {
        await this.readStatement();
      } else if (s < STAGE.COMPLETE) {
        await this.say([['BORGE', state.flag('borgeHelp')
          ? 'Adamlarım ön kapıda gürültü yapacak. Arka bahçeden gir. Ve geri dön, Gianlico.'
          : 'Monte Mario’ya yalnız gidiyorsun. Babanın inadı. Git — ama geri dön.']]);
      } else {
        await this.say([['BORGE', d.ending === 'sangue'
          ? 'Arka oda senin artık. Baban o sandalyeden hep kaçtı. Sen oturdun.'
          : 'Yarın sabah Palazzo di Giustizia’ya gidiyorum. İmzam o kâğıtta. Barı Tonino’ya bırakıyorum.']]);
      }
    });
  }

  async showManifest() {
    await this.say([
      ['GIANLICO', 'Civitavecchia. A. ve C. — Arisel ve Cranier. Babamın adı aranızda çizilmiş.'],
      ['BORGE', '…Evet. O imzalardan biri benim. Cranier’le son ortak işimizdi.'],
      ['BORGE', 'Kâğıtta zeytinyağı yazıyordu. Kırk varil. İçinde ne olduğunu sormadım.'],
      ['BORGE', 'Baban sordu.']
    ]);
    const pick = await this.choose('GIANLICO', 'Borge’un elleri masada, kıpırtısız.', [
      '“Babamı sen mi öldürdün?”',
      '“Neden sormadın?”'
    ]);
    if (pick === 0) {
      await this.say([['BORGE', 'Hayır. Ama onu durduramadım da. Bu yüzden sana yalan söyledim.']]);
    } else {
      await this.say([['BORGE', 'Çünkü soru soranlar bu şehirde yaşlanmaz. Baban otuz yıl sormadı. Sonra bir gün sordu.']]);
    }
    await this.say([
      ['BORGE', 'Liman ofisi her yükü deftere yazar. Ne geldiyse, kim teslim aldıysa.'],
      ['BORGE', 'Civitavecchia’da Nico diye biri var. Babanla aynı gemide tayfaydı. Sana yardım eder.'],
      ['BORGE', 'Elena’nın durağından gece hattına bin. Ben gelemem; yüzüm orada tanınır.']
    ]);
    state.unlockStop('civitavecchia');
    await this.setStage(STAGE.TRAVEL_PORT);
  }

  async revealVitale() {
    await this.say([
      ['GIANLICO', 'Liman kaydında Questura plakalı bir Alfetta var. Sevkiyatın eskortu.'],
      ['GIANLICO', 'Elena o gece babamın bindiği arabayı gördü: koyu mavi Alfetta, ön camda mavi lamba.'],
      ['BORGE', '…Renzo Vitale. Commissario. Cranier’in maaş bordrosundaki en pahalı isim.'],
      ['BORGE', 'Baban o gece bana polise gideceğini söyledi. Vitale’ye. 1968’den tanışırlarmış; güvenebileceği tek polisin o olduğunu sanıyordu.'],
      ['BORGE', 'Durakta tartıştık. Onu durdurmaya çalıştım. Sonra Alfetta geldi. “Beni eve bırakacaklar” dedi.'],
      ['BORGE', 'Eve varmadı.']
    ]);
    const pick = await this.choose('GIANLICO', 'Bar sessiz. Tonino bardak silmeyi bırakmış.', [
      '“Neden onu arabaya bindirdin?”',
      '“Vitale’nin ofisi nerede?”'
    ]);
    if (pick === 0) {
      await this.say([['BORGE', 'Bindirmedim. Durdurmadım. Aradaki farkı her gece kendime anlatıyorum.']]);
    }
    await this.say([
      ['BORGE', 'Questura. Arşiv katı. Babanın ifadesi varsa oradadır — Vitale hiçbir şeyi yakmaz. Her şeyi saklar; koz olarak.'],
      ['BORGE', 'Arka avludan girilir. Gece nöbetçileri polis, Gianlico. Onlara el kaldırma — görünme.'],
      ['BORGE', 'Sigorta kutuları koridor ışıklarını keser. Nöbetçiler bakmaya gider; o an senin anındır.']
    ]);
    state.unlockStop('questura');
    await this.setStage(STAGE.INFILTRATE_QUESTURA);
  }

  async readStatement() {
    await this.say([
      ['GIANLICO', 'Buldum. Babamın ifadesi. Vitale’nin çekmecesinde, mühürlü zarfta.'],
      ['NOT', '“Ben, Paolo Bianchi, 31 numaralı sevkiyatta kırk varil zeytinyağı değil, varillerin dibine gizlenmiş eroin taşındığını beyan ederim.”'],
      ['NOT', '“Alıcı: Monte Cranier. Eskort: Commissario Renzo Vitale. Bu ifadeyi Giudice Ruggero Ferri’ye iletilmek üzere veriyorum.”'],
      ['BORGE', '…Eroin. Tanrım. Ben yağ sanıyordum. Sormadım bile.'],
      ['BORGE', 'Vitale ifadenin gittiğini fark etti. Bu gece Cranier’in villasına koşacak. Monte Mario.'],
      ['BORGE', 'Ferri’ye gitmeden önce onları bulursan… o zaman karar senin.']
    ]);
    if (state.data.rep >= 50) {
      const pick = await this.choose('BORGE', 'Adamlarım ön kapıda gürültü yapabilir. Bahçedeki nöbetçileri çekerler.', [
        'Kabul et: “Dikkatlerini dağıtsınlar.”',
        'Reddet: “Bunu yalnız yapacağım.”'
      ]);
      if (pick === 0) {
        state.setFlag('borgeHelp');
        await this.say([['BORGE', 'Yarım saat sonra ön kapıda olacaklar. Arka bahçeden gir.']]);
      } else {
        this.addRep(3);
        await this.say([['BORGE', 'Babanın inadı. Peki.']]);
      }
    } else {
      await this.say([['BORGE', 'Adamlarım seninle gelmez, Gianlico. Mahallede senin hakkında konuşulanları duydular.']]);
    }
    await this.say([['BORGE', 'Tonino’dan iki panino al. Aç karnına ölünmez.']]);
    state.addItem('panino', 2);
    this.hud.toast('Panino ×2', HEX.cream, 'icon-panino');
    state.unlockStop('montemario');
    await this.setStage(STAGE.TRAVEL_VILLA);
  }
}
