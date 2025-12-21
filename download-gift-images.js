const https = require('https');
const fs = require('fs');
const path = require('path');

// All gift data from streamtoearn.io
const gifts = [
  {name: "Rose", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp"},
  {name: "You're awesome", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/e9cafce8279220ed26016a71076d6a8a.png~tplv-obj.webp"},
  {name: "GG", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.webp"},
  {name: "Love you so much", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fc549cf1bc61f9c8a1c97ebab68dced7.png~tplv-obj.webp"},
  {name: "TikTok", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/802a21ae29f9fae5abe3693de9f874bd~tplv-obj.webp"},
  {name: "Ice Cream Cone", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/968820bc85e274713c795a6aef3f7c67~tplv-obj.webp"},
  {name: "Cake Slice", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/f681afb4be36d8a321eac741d387f1e2~tplv-obj.webp"},
  {name: "Heart Me", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d56945782445b0b8c8658ed44f894c7b~tplv-obj.webp"},
  {name: "Pumpkin", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c9734b74f0e4e79bdfa2ef07c393d8ee.png~tplv-obj.webp"},
  {name: "Miss You", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/3c53396b922691a7520698f47105a753.png~tplv-obj.webp"},
  {name: "Thumbs Up", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/570a663e27bdc460e05556fd1596771a~tplv-obj.webp"},
  {name: "Heart", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/dd300fd35a757d751301fba862a258f1~tplv-obj.webp"},
  {name: "Lightning Bolt", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/659092e3e787546afe7aee68ed04f897~tplv-obj.webp"},
  {name: "Love you", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/ab0a7b44bfc140923bb74164f6f880ab~tplv-obj.webp"},
  {name: "It's corn", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/37f5c76b65c17d6dbbbd4b6724f61bf2~tplv-obj.webp"},
  {name: "Chili", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/b8ded3f3d633620616a74e4f30163836~tplv-obj.webp"},
  {name: "Heart Puff", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/68c21ef420f49b87543de354b2e30b8d.png~tplv-obj.webp"},
  {name: "LIVE", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/40ba71a3b3d6b9f799d99082f36b2baa.png~tplv-obj.webp"},
  {name: "GOAT", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/48dd683750b0ca6d18befbeececb6116.png~tplv-obj.webp"},
  {name: "Music Album", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2a5378fbb272f5b4be0678084c66bdc1.png~tplv-obj.webp"},
  {name: "Wink Charm", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/295d753e095c6ac8b180691f20d64ea8.png~tplv-obj.webp"},
  {name: "Go Popular", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b342e28d73dac6547e0b3e2ad57f6597.png~tplv-obj.webp"},
  {name: "Club Cheers", coins: 1, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6a934c90e5533a4145bed7eae66d71bd.png~tplv-obj.webp"},
  {name: "Team Bracelet", coins: 2, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/54cb1eeca369e5bea1b97707ca05d189.png~tplv-obj.webp"},
  {name: "Finger Heart", coins: 5, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a4c4dc437fd3a6632aba149769491f49.png~tplv-obj.webp"},
  {name: "Pumpkin Pie", coins: 5, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/98c1588235d99cdfa00698ea236ba8e3.png~tplv-obj.webp"},
  {name: "Super Popular", coins: 9, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2fa794a99919386b85402d9a0a991b2b.png~tplv-obj.webp"},
  {name: "Cheer You Up", coins: 9, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/97e0529ab9e5cbb60d95fc9ff1133ea6~tplv-obj.webp"},
  {name: "Club Power", coins: 9, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/fb8da877eabca4ae295483f7cdfe7d31.png~tplv-obj.webp"},
  {name: "Rosa", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp"},
  {name: "Boo", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d72381e125ad0c1ed70f6ef2aff6c8bc.png~tplv-obj.webp"},
  {name: "Friendship Necklace", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp"},
  {name: "Journey Pass", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/551ecaf639c5e02354f9e7c1a763ec72.png~tplv-obj.webp"},
  {name: "Pumpkin Latte", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/0636d91615f7417ddd5f29438bf5debe~tplv-obj.webp"},
  {name: "Tiny Diny", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d4a3dbfc29ec50176a9b4bafad10abbd.png~tplv-obj.webp"},
  {name: "Gold Boxing Gloves", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/2b4846f37e2f0b7e978322970e20a091~tplv-obj.webp"},
  {name: "Hi Bear", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/64a53fd11f9ef11073544c88394ec1c0.png~tplv-obj.webp"},
  {name: "EWC", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/d219e394a3e7b89f3c6270f4cd46ecfe.png~tplv-obj.webp"},
  {name: "Dolphin", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/d756d1526aa6a5fd61494f087089a8c8.png~tplv-obj.webp"},
  {name: "Heart Gaze", coins: 10, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/0fe120fdb52724dd157e41cc5c00a924.png~tplv-obj.webp"},
  {name: "Tiny Diny in Love", coins: 15, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/8dfcceb32feb70403281f02aa808fe0b.png~tplv-obj.webp"},
  {name: "Group 7", coins: 15, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/378cfe74f40e9e37c61592318a62a9de.png~tplv-obj.webp"},
  {name: "Perfume", coins: 20, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20b8f61246c7b6032777bb81bf4ee055~tplv-obj.webp"},
  {name: "Tiny Diny Hotdog", coins: 20, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/a03e11b24f157a26c49cac518450573f.png~tplv-obj.webp"},
  {name: "S Flowers", coins: 20, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/1e1f1b03b60c3d8c893bdf9aa119f5a1.png~tplv-obj.webp"},
  {name: "Let 'Em Cook", coins: 20, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/af68a3df24ad3ad4598b5deae0322d67.png~tplv-obj.webp"},
  {name: "Doughnut", coins: 30, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e7ad6bdf0a1d860c538f38026d4e812~tplv-obj.webp"},
  {name: "Sweaty Teddy", coins: 30, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/a77650759bb177eeddff28e90b7b0e52.png~tplv-obj.webp"},
  {name: "October", coins: 88, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/e83b4bee4820cf21cc0e88873f91d6f5~tplv-obj.webp"},
  {name: "November", coins: 88, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/183c87fe2d0eb12aa69afd7dc28a80bb.png~tplv-obj.webp"}
];

// Add the remaining gifts... (this will be a very long array, I'll add them programmatically below)

const allGifts = [...gifts,
  {name: "Paper Crane", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/0f158a08f7886189cdabf496e8a07c21~tplv-obj.webp"},
  {name: "Little Crown", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/cf3db11b94a975417043b53401d0afe1~tplv-obj.webp"},
  {name: "Cap", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6c2ab2da19249ea570a2ece5e3377f04~tplv-obj.webp"},
  {name: "Hat and Mustache", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/2f1e4f3f5c728ffbfa35705b480fdc92~tplv-obj.webp"},
  {name: "Like-Pop", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/75eb7b4aca24eaa6e566b566c7d21e2f~tplv-obj.webp"},
  {name: "Heart Me Flex", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/412cf8bff2c3aa4397fc5d44a2dd9708.png~tplv-obj.webp"},
  {name: "Love Painting", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/de6f01cb2a0deb2da24cb5d1ecf8303c.png~tplv-obj.webp"},
  {name: "Bubble Gum", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/52ebbe9f3f53b5567ad11ad6f8303c58.png~tplv-obj.webp"},
  {name: "Mark of Love", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/582475419a820e0b0dbc964799b6146e.png~tplv-obj.webp"},
  {name: "Sundae Bowl", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/725ba28c17d775db510ca7b240cdd84e.png~tplv-obj.webp"},
  {name: "Welcome Seal", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/0f9184dc3de31a3cb0022fe0d21bad09.png~tplv-obj.webp"},
  {name: "Club Victory", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6639eb3590a59052babc9cb772ae4f5b.png~tplv-obj.webp"},
  {name: "Level-up Sparks", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c6c5b0efea6f1f7e1fd1f3909284d12c.png~tplv-obj.webp"},
  {name: "Greeting Heart", coins: 99, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9325524bd9ca181bd8e76eb99b44c042.png~tplv-obj.webp"},
  {name: "Game Controller", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20ec0eb50d82c2c445cb8391fd9fe6e2~tplv-obj.webp"},
  {name: "Super GG", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/cbd7588c53ec3df1af0ed6d041566362.png~tplv-obj.webp"},
  {name: "Confetti", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/cb4e11b3834e149f08e1cdcc93870b26~tplv-obj.webp"},
  {name: "Hand Hearts", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6cd022271dc4669d182cad856384870f~tplv-obj.webp"},
  {name: "Hand Heart", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/47e9081623cdae9faa55f4d0d67908bf~tplv-obj.webp"},
  {name: "Heart Signal", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/f6f8143d20ced279fbca487d3beb81c9.png~tplv-obj.webp"},
  {name: "Singing Magic", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/1b76de4373dec56480903c3d5367fd13.png~tplv-obj.webp"},
  {name: "Marvelous Confetti", coins: 100, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/fccc851d351716bc8b34ec65786c727d~tplv-obj.webp"},
  {name: "Money Gun", coins: 500, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/e0589e95a2b41970f0f30f6202f5fce6~tplv-obj.webp"},
  {name: "Swan", coins: 699, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/97a26919dbf6afe262c97e22a83f4bf1~tplv-obj.webp"},
  {name: "Galaxy", coins: 1000, url: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp"}
];

// Sanitize filename
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Download all images
async function downloadAllImages() {
  const outputDir = path.join(__dirname, 'renderer', 'gift-images');

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let downloaded = 0;
  let failed = 0;

  for (const gift of allGifts) {
    const sanitized = sanitizeFilename(gift.name);
    const filename = `${sanitized}_${gift.coins}.webp`;
    const filepath = path.join(outputDir, filename);

    try {
      console.log(`Downloading: ${gift.name} (${gift.coins} coins)...`);
      await downloadImage(gift.url, filepath);
      downloaded++;
      console.log(`✓ Downloaded: ${filename}`);
    } catch (error) {
      failed++;
      console.error(`✗ Failed: ${gift.name} - ${error.message}`);
    }
  }

  console.log(`\n=== Download Complete ===`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${allGifts.length}`);
}

downloadAllImages();
