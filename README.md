# Sangue

**Sangue**, 1980 Roma'sında geçen, hikâye odaklı bir 2D noir aksiyon-gizlilik oyunudur. Gianlico Bianchi babasının ölümünün arkasındaki gerçeği arar. Yol Trastevere'nin ıslak sokaklarından Civitavecchia limanına, oradan Questura'nın arşivine ve Monte Mario'daki Villa Cranier'e uzanır.

Oyunun bütün grafikleri, sesleri ve müziği çalışma anında kodla üretilir. Projede tek bir görsel ya da ses dosyası yoktur.

## Oyun

- **6 bölüm, 2 final.** Capitolo I–VI boyunca kanıt toplanır. Son sahnede verilen karar ya **VERITÀ** ya da **SANGUE** finalini açar. Rispetto seviyesi ve toplanan anılar epilog sayfalarını değiştirir.
- **7 oynanabilir mekân:** Trastevere sokağı, Bar Arisel, Casa Bianchi (güvenli ev), Civitavecchia limanı, Questura Centrale, Villa Cranier ve Cranier'in çalışma odası.
- **Gizlilik:** Düşmanların görüş konisi görünür, şüphe ölçerleri dolar (`?` → `!`). Karanlıkta ya da siper arkasında çömelen oyuncu gizlenir. Yere serilmiş bir arkadaşını gören nöbetçi soruşturmaya gelir. Sigorta kutuları ışıkları keser ve en yakın nöbetçiyi kendine çeker.
- **Dövüş:** 3 vuruşluk kombo, dokunulmazlık kareli kaçınma ve arkadan sessiz etkisiz bırakma. Vuruşlarda kısa donma (hit-stop), ekran sarsıntısı ve kıvılcım efekti var. Düşman saldırıları önceden yanıp sönerek haber verir.
- **Boss:** Commissario Vitale kırmızı lazerle nişan alır. Siper arkasında çömelerek ya da kaçınarak atışlardan kurtulursun. Şarjör değiştirirken saldırmak gerekir. Canı yarıya inince ikinci faza geçer.
- **Questura:** Yalnızca gizlilikle geçilir. Polise görünmek doğrudan yakalanmak demektir.
- **Ekonomi:** Lira, Rispetto, Tonino'nun dükkânı (espresso, panino) ve Elena'nın bilet kulübesi. Hikâye yolculukları ve eve dönüş ücretsizdir; hiçbir zorunlu harcama ilerlemeyi kilitlemez.
- **Rispetto:** Diyalog seçimleri itibarı değiştirir. 55'in üstünde Nico anahtarı ücretsiz verir. 50'nin üstünde Borge finalde adamlarını yardıma gönderir. 70'in üstünde dükkânlar mahalle fiyatı uygular. Epilog de itibarı yansıtır.
- **Günlük (TAB):** Kanıtlar, 6 gizli anı, çanta ve bölüme göre güncellenen kişi dosyaları. Altı anının hepsini bulan oyuncu finalde babasının mektubunu okur.
- **Harita:** Otobüs duraklarından keşfedilmiş mekânlar arasında hızlı seyahat edilir.
- **Kayıt:** Kontrol noktaları ve sahne geçişlerinde otomatik kayıt yapılır. Dairedeki yatakta dinlenmek canı doldurur ve oyunu kaydeder. Ölünce son kayda dönülür.
- **Sunum:** Sinematik diyalog (letterbox, portre, daktilo efekti, karaktere özel ses tonu), bölüm kartları, parallax Roma silüeti, yağmur ve sıçramalar, şimşek, sis ve dinamik ışık/karanlık katmanı.
- **Ses:** WebAudio ile üretilen uyarlanabilir müzik. Keşif, gizlilik, çatışma ve boss müzikleri arasında geçiş yapılır; mandolin tremolosu da kullanılır. Yağmur, deniz, cırcır böceği ve alarm ortam sesleri ile bütün efektler de kodla üretilir.

## Çalıştırma

Proje build gerektirmez. ES module kullandığı için yerel bir HTTP sunucusu yeterlidir:

```bash
python -m http.server 8080
```

Ardından `http://localhost:8080` adresini aç.

## Kontroller

| Tuş | Eylem |
| --- | --- |
| `A / D` · `← / →` | Yürü |
| `SPACE / W` | Zıpla (basılı tutunca daha yükseğe) |
| `S / ↓` | Çömel · gizlen · alçak geçitler |
| `S + SPACE` | İnce platformdan aşağı in |
| `J / F` | Yumruk (3'lü kombo) · arkadan: sessiz etkisiz bırak |
| `SHIFT / K` | Kaçın |
| `E` | Etkileşim · konuş · incele |
| `Q` | Espresso / panino ile iyileş |
| `TAB / I` | Günlük |
| `ESC / P` | Duraklat |

Gamepad (standart eşleme): A zıpla · X vur · B kaç · Y etkileşim · LB iyileş · Start duraklat · Back günlük.

## Kod yapısı

```
src/
  game.js              Phaser yapılandırması, sahne listesi, ?dev araçları
  config.js            Ekran, zemin çizgisi, renkler, derinlik bantları
  story.js             Aşamalar, hedefler, bölümler, kayıt biçimi ve göçü
  core/                state (oyun durumu), settings, audio (prosedürel), controls
  gfx/                 characters (sprite sheet), portraits, textures (çevre sanatı)
  systems/             player, enemy (+ Vitale), dialogue, hud, fx
  scenes/
    world.js           Tüm mekânların temel sahnesi
    menu.js            Boot, ana menü, intro
    cinematics.js      Otobüs yolculuğu, finaller ve jenerik
    overlays.js        Duraklatma, günlük, harita, oyun sonu
    ui.js              Menü listesi, ayarlar paneli
    levels/            rome, bar, apartment, port, questura, villa
```

`?dev` parametresiyle açıldığında tarayıcı konsolunda `SANGUE.warp('port', SANGUE.STAGE.INFILTRATE_PORT)` gibi komutlarla bölümler arasında atlanabilir.

## Kayıt uyumluluğu

Kayıtlar `sangue-save-v1` anahtarında sürümlü tutulur. v1 (Capitolo I) ve v2 (Capitolo II–III) kayıtları v3'e otomatik taşınır ve kaldıkları aşamadan devam eder.
