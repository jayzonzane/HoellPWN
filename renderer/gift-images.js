// TikTok Gift Images - Local paths with CDN fallback
// Source: https://streamtoearn.io/gifts?region=US
// Images downloaded locally for offline use
// Falls back to TikTok CDN if local image not found

const GIFT_IMAGE_BASE_CDN = 'https://p16-webcast.tiktokcdn.com/img';
// Use relative path from HTML file location (works in both dev and production)
const LOCAL_IMAGE_PATH = './gift-images/';

// Get the downloaded images path (in userData directory)
// This is populated by the main process when images are downloaded
let DOWNLOADED_IMAGES_PATH = null;

// Function to set the downloaded images path (called from main process)
function setDownloadedImagesPath(path) {
  DOWNLOADED_IMAGES_PATH = path;
  console.log('Downloaded images path set to:', path);
}

// Map gift names to sanitized filenames
function sanitizeForFilename(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Gift image data with both local and CDN URLs
// Format: { coinValue: { giftName: { local: path, cdn: url } } }
const GIFT_IMAGES = {
  1: {
    "Rose": {
      local: `${LOCAL_IMAGE_PATH}rose_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp"
    },
    "You're awesome": {
      local: `${LOCAL_IMAGE_PATH}youre_awesome_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/e9cafce8279220ed26016a71076d6a8a.png~tplv-obj.webp"
    },
    "GG": {
      local: `${LOCAL_IMAGE_PATH}gg_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.webp"
    },
    "Love you so much": {
      local: `${LOCAL_IMAGE_PATH}love_you_so_much_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fc549cf1bc61f9c8a1c97ebab68dced7.png~tplv-obj.webp"
    },
    "TikTok": {
      local: `${LOCAL_IMAGE_PATH}tiktok_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/802a21ae29f9fae5abe3693de9f874bd~tplv-obj.webp"
    },
    "Ice Cream Cone": {
      local: `${LOCAL_IMAGE_PATH}ice_cream_cone_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/968820bc85e274713c795a6aef3f7c67~tplv-obj.webp"
    },
    "Cake Slice": {
      local: `${LOCAL_IMAGE_PATH}cake_slice_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/f681afb4be36d8a321eac741d387f1e2~tplv-obj.webp"
    },
    "Heart Me": {
      local: `${LOCAL_IMAGE_PATH}heart_me_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d56945782445b0b8c8658ed44f894c7b~tplv-obj.webp"
    },
    "Pumpkin": {
      local: `${LOCAL_IMAGE_PATH}pumpkin_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c9734b74f0e4e79bdfa2ef07c393d8ee.png~tplv-obj.webp"
    },
    "Miss You": {
      local: `${LOCAL_IMAGE_PATH}miss_you_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/3c53396b922691a7520698f47105a753.png~tplv-obj.webp"
    },
    "Thumbs Up": {
      local: `${LOCAL_IMAGE_PATH}thumbs_up_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/570a663e27bdc460e05556fd1596771a~tplv-obj.webp"
    },
    "Heart": {
      local: `${LOCAL_IMAGE_PATH}heart_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/dd300fd35a757d751301fba862a258f1~tplv-obj.webp"
    },
    "Lightning Bolt": {
      local: `${LOCAL_IMAGE_PATH}lightning_bolt_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/659092e3e787546afe7aee68ed04f897~tplv-obj.webp"
    },
    "Love you": {
      local: `${LOCAL_IMAGE_PATH}love_you_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/ab0a7b44bfc140923bb74164f6f880ab~tplv-obj.webp"
    },
    "It's corn": {
      local: `${LOCAL_IMAGE_PATH}its_corn_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/37f5c76b65c17d6dbbbd4b6724f61bf2~tplv-obj.webp"
    },
    "Chili": {
      local: `${LOCAL_IMAGE_PATH}chili_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/b8ded3f3d633620616a74e4f30163836~tplv-obj.webp"
    },
    "Heart Puff": {
      local: `${LOCAL_IMAGE_PATH}heart_puff_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/68c21ef420f49b87543de354b2e30b8d.png~tplv-obj.webp"
    },
    "LIVE": {
      local: `${LOCAL_IMAGE_PATH}live_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/40ba71a3b3d6b9f799d99082f36b2baa.png~tplv-obj.webp"
    },
    "GOAT": {
      local: `${LOCAL_IMAGE_PATH}goat_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/48dd683750b0ca6d18befbeececb6116.png~tplv-obj.webp"
    },
    "Music Album": {
      local: `${LOCAL_IMAGE_PATH}music_album_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2a5378fbb272f5b4be0678084c66bdc1.png~tplv-obj.webp"
    },
    "Wink Charm": {
      local: `${LOCAL_IMAGE_PATH}wink_charm_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/295d753e095c6ac8b180691f20d64ea8.png~tplv-obj.webp"
    },
    "Go Popular": {
      local: `${LOCAL_IMAGE_PATH}go_popular_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b342e28d73dac6547e0b3e2ad57f6597.png~tplv-obj.webp"
    },
    "Club Cheers": {
      local: `${LOCAL_IMAGE_PATH}club_cheers_1.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6a934c90e5533a4145bed7eae66d71bd.png~tplv-obj.webp"
    },
  },
  2: {
    "Team Bracelet": {
      local: `${LOCAL_IMAGE_PATH}team_bracelet_2.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/54cb1eeca369e5bea1b97707ca05d189.png~tplv-obj.webp"
    },
  },
  5: {
    "Finger Heart": {
      local: `${LOCAL_IMAGE_PATH}finger_heart_5.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a4c4dc437fd3a6632aba149769491f49.png~tplv-obj.webp"
    },
    "Pumpkin Pie": {
      local: `${LOCAL_IMAGE_PATH}pumpkin_pie_5.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/98c1588235d99cdfa00698ea236ba8e3.png~tplv-obj.webp"
    },
  },
  9: {
    "Super Popular": {
      local: `${LOCAL_IMAGE_PATH}super_popular_9.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2fa794a99919386b85402d9a0a991b2b.png~tplv-obj.webp"
    },
    "Cheer You Up": {
      local: `${LOCAL_IMAGE_PATH}cheer_you_up_9.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/97e0529ab9e5cbb60d95fc9ff1133ea6~tplv-obj.webp"
    },
    "Club Power": {
      local: `${LOCAL_IMAGE_PATH}club_power_9.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/fb8da877eabca4ae295483f7cdfe7d31.png~tplv-obj.webp"
    },
  },
  10: {
    "Rosa": {
      local: `${LOCAL_IMAGE_PATH}rosa_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp"
    },
    "Boo": {
      local: `${LOCAL_IMAGE_PATH}boo_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d72381e125ad0c1ed70f6ef2aff6c8bc.png~tplv-obj.webp"
    },
    "Friendship Necklace": {
      local: `${LOCAL_IMAGE_PATH}friendship_necklace_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp"
    },
    "Journey Pass": {
      local: `${LOCAL_IMAGE_PATH}journey_pass_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/551ecaf639c5e02354f9e7c1a763ec72.png~tplv-obj.webp"
    },
    "Pumpkin Latte": {
      local: `${LOCAL_IMAGE_PATH}pumpkin_latte_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/0636d91615f7417ddd5f29438bf5debe~tplv-obj.webp"
    },
    "Tiny Diny": {
      local: `${LOCAL_IMAGE_PATH}tiny_diny_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d4a3dbfc29ec50176a9b4bafad10abbd.png~tplv-obj.webp"
    },
    "Gold Boxing Gloves": {
      local: `${LOCAL_IMAGE_PATH}gold_boxing_gloves_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/2b4846f37e2f0b7e978322970e20a091~tplv-obj.webp"
    },
    "Hi Bear": {
      local: `${LOCAL_IMAGE_PATH}hi_bear_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/64a53fd11f9ef11073544c88394ec1c0.png~tplv-obj.webp"
    },
    "EWC": {
      local: `${LOCAL_IMAGE_PATH}ewc_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/d219e394a3e7b89f3c6270f4cd46ecfe.png~tplv-obj.webp"
    },
    "Dolphin": {
      local: `${LOCAL_IMAGE_PATH}dolphin_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/d756d1526aa6a5fd61494f087089a8c8.png~tplv-obj.webp"
    },
    "Heart Gaze": {
      local: `${LOCAL_IMAGE_PATH}heart_gaze_10.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/0fe120fdb52724dd157e41cc5c00a924.png~tplv-obj.webp"
    },
  },
  15: {
    "Tiny Diny in Love": {
      local: `${LOCAL_IMAGE_PATH}tiny_diny_in_love_15.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/8dfcceb32feb70403281f02aa808fe0b.png~tplv-obj.webp"
    },
    "Group 7": {
      local: `${LOCAL_IMAGE_PATH}group_7_15.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/378cfe74f40e9e37c61592318a62a9de.png~tplv-obj.webp"
    },
  },
  20: {
    "Perfume": {
      local: `${LOCAL_IMAGE_PATH}perfume_20.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20b8f61246c7b6032777bb81bf4ee055~tplv-obj.webp"
    },
    "Tiny Diny Hotdog": {
      local: `${LOCAL_IMAGE_PATH}tiny_diny_hotdog_20.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/a03e11b24f157a26c49cac518450573f.png~tplv-obj.webp"
    },
    "S Flowers": {
      local: `${LOCAL_IMAGE_PATH}s_flowers_20.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/1e1f1b03b60c3d8c893bdf9aa119f5a1.png~tplv-obj.webp"
    },
    "Let 'Em Cook": {
      local: `${LOCAL_IMAGE_PATH}let_em_cook_20.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/af68a3df24ad3ad4598b5deae0322d67.png~tplv-obj.webp"
    },
  },
  30: {
    "Doughnut": {
      local: `${LOCAL_IMAGE_PATH}doughnut_30.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e7ad6bdf0a1d860c538f38026d4e812~tplv-obj.webp"
    },
    "Sweaty Teddy": {
      local: `${LOCAL_IMAGE_PATH}sweaty_teddy_30.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/a77650759bb177eeddff28e90b7b0e52.png~tplv-obj.webp"
    },
  },
  88: {
    "October": {
      local: `${LOCAL_IMAGE_PATH}october_88.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/e83b4bee4820cf21cc0e88873f91d6f5~tplv-obj.webp"
    },
    "November": {
      local: `${LOCAL_IMAGE_PATH}november_88.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/183c87fe2d0eb12aa69afd7dc28a80bb.png~tplv-obj.webp"
    },
  },
  99: {
    "Paper Crane": {
      local: `${LOCAL_IMAGE_PATH}paper_crane_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/0f158a08f7886189cdabf496e8a07c21~tplv-obj.webp"
    },
    "Little Crown": {
      local: `${LOCAL_IMAGE_PATH}little_crown_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/cf3db11b94a975417043b53401d0afe1~tplv-obj.webp"
    },
    "Cap": {
      local: `${LOCAL_IMAGE_PATH}cap_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6c2ab2da19249ea570a2ece5e3377f04~tplv-obj.webp"
    },
    "Hat and Mustache": {
      local: `${LOCAL_IMAGE_PATH}hat_and_mustache_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/2f1e4f3f5c728ffbfa35705b480fdc92~tplv-obj.webp"
    },
    "Like-Pop": {
      local: `${LOCAL_IMAGE_PATH}likepop_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/75eb7b4aca24eaa6e566b566c7d21e2f~tplv-obj.webp"
    },
    "Heart Me Flex": {
      local: `${LOCAL_IMAGE_PATH}heart_me_flex_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/412cf8bff2c3aa4397fc5d44a2dd9708.png~tplv-obj.webp"
    },
    "Love Painting": {
      local: `${LOCAL_IMAGE_PATH}love_painting_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/de6f01cb2a0deb2da24cb5d1ecf9a23b.png~tplv-obj.webp"
    },
    "Bubble Gum": {
      local: `${LOCAL_IMAGE_PATH}bubble_gum_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/52ebbe9f3f53b5567ad11ad6f8303c58.png~tplv-obj.webp"
    },
    "Mark of Love": {
      local: `${LOCAL_IMAGE_PATH}mark_of_love_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/582475419a820e0b0dbc964799b6146e.png~tplv-obj.webp"
    },
    "Sundae Bowl": {
      local: `${LOCAL_IMAGE_PATH}sundae_bowl_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/725ba28c17d775db510ca7b240cdd84e.png~tplv-obj.webp"
    },
    "Welcome Seal": {
      local: `${LOCAL_IMAGE_PATH}welcome_seal_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/0f9184dc3de31a3cb0022fe0d21bad09.png~tplv-obj.webp"
    },
    "Club Victory": {
      local: `${LOCAL_IMAGE_PATH}club_victory_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6639eb3590a59052babc9cb772ae4f5b.png~tplv-obj.webp"
    },
    "Level-up Sparks": {
      local: `${LOCAL_IMAGE_PATH}levelup_sparks_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c6c5b0efea6f1f7e1fd1f3909284d12c.png~tplv-obj.webp"
    },
    "Greeting Heart": {
      local: `${LOCAL_IMAGE_PATH}greeting_heart_99.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9325524bd9ca181bd8e76eb99b44c042.png~tplv-obj.webp"
    },
  },
  100: {
    "Game Controller": {
      local: `${LOCAL_IMAGE_PATH}game_controller_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20ec0eb50d82c2c445cb8391fd9fe6e2~tplv-obj.webp"
    },
    "Super GG": {
      local: `${LOCAL_IMAGE_PATH}super_gg_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/cbd7588c53ec3df1af0ed6d041566362.png~tplv-obj.webp"
    },
    "Confetti": {
      local: `${LOCAL_IMAGE_PATH}confetti_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/cb4e11b3834e149f08e1cdcc93870b26~tplv-obj.webp"
    },
    "Hand Hearts": {
      local: `${LOCAL_IMAGE_PATH}hand_hearts_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6cd022271dc4669d182cad856384870f~tplv-obj.webp"
    },
    "Hand Heart": {
      local: `${LOCAL_IMAGE_PATH}hand_heart_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/47e9081623cdae9faa55f4d0d67908bf~tplv-obj.webp"
    },
    "Heart Signal": {
      local: `${LOCAL_IMAGE_PATH}heart_signal_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/f6f8143d20ced279fbca487d3beb81c9.png~tplv-obj.webp"
    },
    "Singing Magic": {
      local: `${LOCAL_IMAGE_PATH}singing_magic_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/1b76de4373dec56480903c3d5367fd13.png~tplv-obj.webp"
    },
    "Marvelous Confetti": {
      local: `${LOCAL_IMAGE_PATH}marvelous_confetti_100.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/fccc851d351716bc8b34ec65786c727d~tplv-obj.webp"
    },
  },
  149: {
    "Heart Rain": {
      local: `${LOCAL_IMAGE_PATH}heart_rain_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/be28619d8b8d1dc03f91c7c63e4e0260.png~tplv-obj.webp"
    },
    "Bowknot": {
      local: `${LOCAL_IMAGE_PATH}bowknot_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/dd02c4c2cb726134314e89abec0b5476.png~tplv-obj.webp"
    },
    "Big Shout Out": {
      local: `${LOCAL_IMAGE_PATH}big_shout_out_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d79737225a5c68dee52b34d1a7c7dec9.png~tplv-obj.webp"
    },
    "Chatting Popcorn": {
      local: `${LOCAL_IMAGE_PATH}chatting_popcorn_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/f4813ddce6a6b3268df01af9fe3764d9.png~tplv-obj.webp"
    },
    "Masquerade": {
      local: `${LOCAL_IMAGE_PATH}masquerade_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/8fde56ae6a7ea22d3d17184ac362585f.png~tplv-obj.webp"
    },
    "Balloon Crown": {
      local: `${LOCAL_IMAGE_PATH}balloon_crown_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d1cc3f587941bd7af50929aee49ac070.png~tplv-obj.webp"
    },
    "Feather Tiara": {
      local: `${LOCAL_IMAGE_PATH}feather_tiara_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/23a0d8c3317d8be5e5a63488a7b2b8c4.png~tplv-obj.webp"
    },
    "Caterpillar Chaos": {
      local: `${LOCAL_IMAGE_PATH}caterpillar_chaos_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5fc71d8f491568b0e258e2de1718e37c.png~tplv-obj.webp"
    },
    "Catrina": {
      local: `${LOCAL_IMAGE_PATH}catrina_149.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fadb0050e89ad6a1731c1a4742360846.png~tplv-obj.webp"
    },
  },
  199: {
    "Love Charger": {
      local: `${LOCAL_IMAGE_PATH}love_charger_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/4548af306fee184d43e2ced3b6f6e5cd.png~tplv-obj.webp"
    },
    "Pinch Cheek": {
      local: `${LOCAL_IMAGE_PATH}pinch_cheek_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d1c75692e369466b4fd23546e513caed~tplv-obj.webp"
    },
    "Sunglasses": {
      local: `${LOCAL_IMAGE_PATH}sunglasses_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/08af67ab13a8053269bf539fd27f3873.png~tplv-obj.webp"
    },
    "Hearts": {
      local: `${LOCAL_IMAGE_PATH}hearts_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/934b5a10dee8376df5870a61d2ea5cb6.png~tplv-obj.webp"
    },
    "Hanging Lights": {
      local: `${LOCAL_IMAGE_PATH}hanging_lights_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/183225b378b1bdf758a992781727b850~tplv-obj.webp"
    },
    "Garland Headpiece": {
      local: `${LOCAL_IMAGE_PATH}garland_headpiece_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/bdbdd8aeb2b69c173a3ef666e63310f3~tplv-obj.webp"
    },
    "Love You": {
      local: `${LOCAL_IMAGE_PATH}love_you_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/134e51c00f46e01976399883ca4e4798~tplv-obj.webp"
    },
    "Cheer For You": {
      local: `${LOCAL_IMAGE_PATH}cheer_for_you_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/1059dfa76c78dc17d7cf0a1fc2ece185~tplv-obj.webp"
    },
    "Panther Paws": {
      local: `${LOCAL_IMAGE_PATH}panther_paws_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/81c8ecd8f50b511a95259a29aea86e96~tplv-obj.webp"
    },
    "Stinging Bee": {
      local: `${LOCAL_IMAGE_PATH}stinging_bee_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c37b8f76d503f5787407a8d7c52f8cb7.png~tplv-obj.webp"
    },
    "Massage for You": {
      local: `${LOCAL_IMAGE_PATH}massage_for_you_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3ebdd3746d91eb06bdd4a04c49c3b04a.png~tplv-obj.webp"
    },
    "Coffee Magic": {
      local: `${LOCAL_IMAGE_PATH}coffee_magic_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/0cb623f44c34f77fe14c2e11bfe4ee62.png~tplv-obj.webp"
    },
    "Meerkat": {
      local: `${LOCAL_IMAGE_PATH}meerkat_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/82c401f409482b0b6dd4f1016d7a4f49.png~tplv-obj.webp"
    },
    "Potato in Paris": {
      local: `${LOCAL_IMAGE_PATH}potato_in_paris_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/0ac3b58039881ac97bd79423121f0d27.png~tplv-obj.webp"
    },
    "Cheering Crab": {
      local: `${LOCAL_IMAGE_PATH}cheering_crab_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7d729b6a8104f5d349ba887608cd35bc.png~tplv-obj.webp"
    },
    "Night Star": {
      local: `${LOCAL_IMAGE_PATH}night_star_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3d136834fe9964927d6b30499a68b741.png~tplv-obj.webp"
    },
    "Wooly Hat": {
      local: `${LOCAL_IMAGE_PATH}wooly_hat_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a234d0187047fa48805c8ea2e1f1f756~tplv-obj.webp"
    },
    "Blow Bubbles": {
      local: `${LOCAL_IMAGE_PATH}blow_bubbles_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3119f192f98539b3d58c12b195811ca5.PNG~tplv-obj.webp"
    },
    "Floating Octopus": {
      local: `${LOCAL_IMAGE_PATH}floating_octopus_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/022d496f79aa50d3042f0660d37ed48a.png~tplv-obj.webp"
    },
    "Flower Headband": {
      local: `${LOCAL_IMAGE_PATH}flower_headband_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/eaec5f24e45bc66ec44830fa5024ab45.png~tplv-obj.webp"
    },
    "Bowtiful Crown": {
      local: `${LOCAL_IMAGE_PATH}bowtiful_crown_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/49ead973a8b72606222e9afe055d694a.png~tplv-obj.webp"
    },
    "Sour Buddy": {
      local: `${LOCAL_IMAGE_PATH}sour_buddy_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/963e12ba84805721d96b06deaf5d660b.png~tplv-obj.webp"
    },
    "Melon Juice": {
      local: `${LOCAL_IMAGE_PATH}melon_juice_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/912d29e708fe00d72487908114803e77.png~tplv-obj.webp"
    },
    "Coconut Juice": {
      local: `${LOCAL_IMAGE_PATH}coconut_juice_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/8157f47f794c8395969034574dd12082.png~tplv-obj.webp"
    },
    "Chirpy Kisses": {
      local: `${LOCAL_IMAGE_PATH}chirpy_kisses_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/c75ec50c453f5b09e4d25c5c69c30ed5.png~tplv-obj.webp"
    },
    "Rose Hand": {
      local: `${LOCAL_IMAGE_PATH}rose_hand_199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/805e6b8051d50ca6e6c9b74d5fc89045.png~tplv-obj.webp"
    },
  },
  200: {
    "Gold Medal": {
      local: `${LOCAL_IMAGE_PATH}gold_medal_200.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/21549ba24f76a01d00373cb8e35660ae.png~tplv-obj.webp"
    },
    "I Love TikTok LIVE": {
      local: `${LOCAL_IMAGE_PATH}i_love_tiktok_live_200.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/49d51360108c4ff1770f2d7c59d7d7cb.png~tplv-obj.webp"
    },
    "Magic Genie": {
      local: `${LOCAL_IMAGE_PATH}magic_genie_200.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b5e625f73f8969623a2bc9ac8fffdf24.png~tplv-obj.webp"
    },
  },
  214: {
    "Rose Bear": {
      local: `${LOCAL_IMAGE_PATH}rose_bear_214.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/adf6e9bd6219788151edb9fa026a0481.png~tplv-obj.webp"
    },
  },
  249: {
    "Pinch Face": {
      local: `${LOCAL_IMAGE_PATH}pinch_face_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/a10aab8940d3d5aee14b14cde033ab2a.png~tplv-obj.webp"
    },
    "Candy Bouquet": {
      local: `${LOCAL_IMAGE_PATH}candy_bouquet_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/935ad03446f993a3630508e5c929b7cf.png~tplv-obj.webp"
    },
    "Star Goggles": {
      local: `${LOCAL_IMAGE_PATH}star_goggles_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/e14483e67a44ce522ba583ec923941fa.png~tplv-obj.webp"
    },
    "Cheer Mic": {
      local: `${LOCAL_IMAGE_PATH}cheer_mic_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/cf2c95f9642541fa9ebe9bdcfe6e7359.png~tplv-obj.webp"
    },
    "Music Bubbles": {
      local: `${LOCAL_IMAGE_PATH}music_bubbles_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b5786e09eb50f1ea512b2ae9f7034254.png~tplv-obj.webp"
    },
    "Palm Breeze": {
      local: `${LOCAL_IMAGE_PATH}palm_breeze_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/dc8043965da9348b305de279cb2fb451.png~tplv-obj.webp"
    },
    "Forest Elf": {
      local: `${LOCAL_IMAGE_PATH}forest_elf_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/1aeb39ecbb493ea520e23588df61caa1.png~tplv-obj.webp"
    },
    "Face-pulling": {
      local: `${LOCAL_IMAGE_PATH}facepulling_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fbbe8af4280240dfdb11ad1100be0282.png~tplv-obj.webp"
    },
    "Ready to Cheer": {
      local: `${LOCAL_IMAGE_PATH}ready_to_cheer_249.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/0df37ad4223ebd30d5bb500c04eb4bb8.png~tplv-obj.webp"
    },
  },
  299: {
    "Boxing Gloves": {
      local: `${LOCAL_IMAGE_PATH}boxing_gloves_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9f8bd92363c400c284179f6719b6ba9c~tplv-obj.webp"
    },
    "Corgi": {
      local: `${LOCAL_IMAGE_PATH}corgi_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/148eef0884fdb12058d1c6897d1e02b9~tplv-obj.webp"
    },
    "Trick or Treat": {
      local: `${LOCAL_IMAGE_PATH}trick_or_treat_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d244d4810758c3227e46074676e33ec8~tplv-obj.webp"
    },
    "Fruit Friends": {
      local: `${LOCAL_IMAGE_PATH}fruit_friends_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/1153dd51308c556cb4fcc48c7d62209f.png~tplv-obj.webp"
    },
    "Turkey Face": {
      local: `${LOCAL_IMAGE_PATH}turkey_face_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/95d981912946e810e747b338d27debb6.png~tplv-obj.webp"
    },
    "Naughty Chicken": {
      local: `${LOCAL_IMAGE_PATH}naughty_chicken_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/46a839dbc1c3e9103c71d82b35b21ad4.png~tplv-obj.webp"
    },
    "Play for You": {
      local: `${LOCAL_IMAGE_PATH}play_for_you_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/34201b86430742595e4dcb5b39560b7a.png~tplv-obj.webp"
    },
    "Rock Star": {
      local: `${LOCAL_IMAGE_PATH}rock_star_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/57acaf0590c56c219493b71fe8d2961d.png~tplv-obj.webp"
    },
    "Butterfly for You": {
      local: `${LOCAL_IMAGE_PATH}butterfly_for_you_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/e02af5a7d59a958bd38536f7e3473f75.png~tplv-obj.webp"
    },
    "Gamer 2025": {
      local: `${LOCAL_IMAGE_PATH}gamer_2025_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/91058c626f0809291e7941969e4f0d05.png~tplv-obj.webp"
    },
    "Puppy Kisses": {
      local: `${LOCAL_IMAGE_PATH}puppy_kisses_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/4ae998a21159b60484169864f8968ba9.png~tplv-obj.webp"
    },
    "Rising Key": {
      local: `${LOCAL_IMAGE_PATH}rising_key_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/e3354ab24f31aad6f98b4a586deccd6a.png~tplv-obj.webp"
    },
    "Legend Crown": {
      local: `${LOCAL_IMAGE_PATH}legend_crown_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/475f9de9ddc448e15df7a04f87e04997.png~tplv-obj.webp"
    },
    "United Heart": {
      local: `${LOCAL_IMAGE_PATH}united_heart_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/72ff280b8c6ce16f6efc9bf4cd6a036b.png~tplv-obj.webp"
    },
    "LIVE Ranking Crown": {
      local: `${LOCAL_IMAGE_PATH}live_ranking_crown_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/1bb7f00a3adeb932e5f5518d723fedb5.png~tplv-obj.webp"
    },
    "Kicker Challenge": {
      local: `${LOCAL_IMAGE_PATH}kicker_challenge_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/8065704646452387f6bed049b194f214.png~tplv-obj.webp"
    },
    "Journal": {
      local: `${LOCAL_IMAGE_PATH}journal_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/c19a947f421a83716f7b2f7259189c8f.png~tplv-obj.webp"
    },
    "Hi! Rosie!": {
      local: `${LOCAL_IMAGE_PATH}hi_rosie_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/c5d90ed49d326785882decc35c4200b0.png~tplv-obj.webp"
    },
    "Go Hamster": {
      local: `${LOCAL_IMAGE_PATH}go_hamster_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/582131434f4f6edc3f97b96fbc33a492.png~tplv-obj.webp"
    },
    "Bat Headwear": {
      local: `${LOCAL_IMAGE_PATH}bat_headwear_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/1ba0996c3dd7db45807fd7f255eb66a4.png~tplv-obj.webp"
    },
    "Budding Heart": {
      local: `${LOCAL_IMAGE_PATH}budding_heart_299.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/80cc308eca861fccd859c089b0647193.png~tplv-obj.webp"
    },
  },
  300: {
    "Feather Mask": {
      local: `${LOCAL_IMAGE_PATH}feather_mask_300.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/088bdb48e5051844d154948b4eb75e5f.png~tplv-obj.webp"
    },
    "Air Dancer": {
      local: `${LOCAL_IMAGE_PATH}air_dancer_300.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/97c975dcce2483027ececde2b6719761.png~tplv-obj.webp"
    },
  },
  349: {
    "Backing Monkey": {
      local: `${LOCAL_IMAGE_PATH}backing_monkey_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/758b0367f5746ec6335f4374dd9b45c3.png~tplv-obj.webp"
    },
    "Become Kitten": {
      local: `${LOCAL_IMAGE_PATH}become_kitten_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2d89dbc83a0999ebab98b4b06d6f5ce1.png~tplv-obj.webp"
    },
    "Marked with Love": {
      local: `${LOCAL_IMAGE_PATH}marked_with_love_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2859c21a400e1f40d93da7b68c0254d0.png~tplv-obj.webp"
    },
    "Vinyl Flip": {
      local: `${LOCAL_IMAGE_PATH}vinyl_flip_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5f5ed81e3e714fc1a30ec6efd379cd91.png~tplv-obj.webp"
    },
    "Juicy Cap": {
      local: `${LOCAL_IMAGE_PATH}juicy_cap_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/e6ce2ee0daae3693268b77efec17507f.png~tplv-obj.webp"
    },
    "Batwing Hat": {
      local: `${LOCAL_IMAGE_PATH}batwing_hat_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/973267050ccb12c111d8048226ac7218.png~tplv-obj.webp"
    },
    "Mystic Drink": {
      local: `${LOCAL_IMAGE_PATH}mystic_drink_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/aa2791b5b47ef26b948ed0ff76f878b5.png~tplv-obj.webp"
    },
    "Sonic Countdown": {
      local: `${LOCAL_IMAGE_PATH}sonic_countdown_349.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/7c593c4b4f3a450dc71e2628e022551d.png~tplv-obj.webp"
    },
  },
  399: {
    "Forever Rosa": {
      local: `${LOCAL_IMAGE_PATH}forever_rosa_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/863e7947bc793f694acbe970d70440a1.png~tplv-obj.webp"
    },
    "Magic Rhythm": {
      local: `${LOCAL_IMAGE_PATH}magic_rhythm_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/00f1882035fcf9407e4b1955f0b4c48b.png~tplv-obj.webp"
    },
    "Relaxed Goose": {
      local: `${LOCAL_IMAGE_PATH}relaxed_goose_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3961645e741423d7b334fb4b6488852f.png~tplv-obj.webp"
    },
    "Tom's Hug": {
      local: `${LOCAL_IMAGE_PATH}toms_hug_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/30ba2b172614d3c2da0e7caaca333b41.png~tplv-obj.webp"
    },
    "Rosie the Rose Bean": {
      local: `${LOCAL_IMAGE_PATH}rosie_the_rose_bean_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3cbaea405cc61e8eaab6f5a14d127511.png~tplv-obj.webp"
    },
    "Jollie the Joy Bean": {
      local: `${LOCAL_IMAGE_PATH}jollie_the_joy_bean_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/0e3769575f5b7b27b67c6330376961a4.png~tplv-obj.webp"
    },
    "Rocky the Rock Bean": {
      local: `${LOCAL_IMAGE_PATH}rocky_the_rock_bean_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/767d7ea90f58f3676bbc5b1ae3c9851d.png~tplv-obj.webp"
    },
    "Sage the Smart Bean": {
      local: `${LOCAL_IMAGE_PATH}sage_the_smart_bean_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/ed2cc456ab1a8619c5093eb8cfd3d303.png~tplv-obj.webp"
    },
    "Sage's Slash": {
      local: `${LOCAL_IMAGE_PATH}sages_slash_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/213605d4582aa3e35b51712c7a0909aa.png~tplv-obj.webp"
    },
    "Let butterfly dances": {
      local: `${LOCAL_IMAGE_PATH}let_butterfly_dances_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/754effcbfbc5c6708c32552ab780e14b.png~tplv-obj.webp"
    },
    "Kitten Kneading": {
      local: `${LOCAL_IMAGE_PATH}kitten_kneading_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/40938efafa13a17de483949934570461.png~tplv-obj.webp"
    },
    "Shoot the Apple": {
      local: `${LOCAL_IMAGE_PATH}shoot_the_apple_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/12a72eac62721ef031f22d935f6aac4b.png~tplv-obj.webp"
    },
    "Alien Buddy": {
      local: `${LOCAL_IMAGE_PATH}alien_buddy_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/4d39819a9bd9731b747e42a1ee650406.png~tplv-obj.webp"
    },
    "Pharaoh Mask": {
      local: `${LOCAL_IMAGE_PATH}pharaoh_mask_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/917b9bef8ad52363b5e1d7cad748e86d.png~tplv-obj.webp"
    },
    "Rosie's Concert": {
      local: `${LOCAL_IMAGE_PATH}rosies_concert_399.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9e9ccba3ad69fb79462faad2d4bab4a5.png~tplv-obj.webp"
    },
  },
  400: {
    "Crystal Dreams": {
      local: `${LOCAL_IMAGE_PATH}crystal_dreams_400.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/4e21d2956bd289847ab8c006d499d25b.png~tplv-obj.webp"
    },
    "Wishing Cake": {
      local: `${LOCAL_IMAGE_PATH}wishing_cake_400.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/6142c30d6b06c1c7748709e02f1293ab.png~tplv-obj.webp"
    },
    "Mic Champ": {
      local: `${LOCAL_IMAGE_PATH}mic_champ_400.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d8678a19d13ab6e2feffbea41acd0ed9.png~tplv-obj.webp"
    },
    "Bounce Speakers": {
      local: `${LOCAL_IMAGE_PATH}bounce_speakers_400.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fc25829fc12db52196c8606000ae17f0.png~tplv-obj.webp"
    },
    "Taraxacum Corgi": {
      local: `${LOCAL_IMAGE_PATH}taraxacum_corgi_400.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/6b9815d3bd44174ab262f2d66ff514cb.png~tplv-obj.webp"
    },
  },
  449: {
    "Beating Heart": {
      local: `${LOCAL_IMAGE_PATH}beating_heart_449.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/11769d71ebd3c6a21f4baa7184791da9.png~tplv-obj.webp"
    },
    "Encore Clap": {
      local: `${LOCAL_IMAGE_PATH}encore_clap_449.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5b5e6863e349500d0c8ad6d67353728b.png~tplv-obj.webp"
    },
    "Pirate's Treasure": {
      local: `${LOCAL_IMAGE_PATH}pirates_treasure_449.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ec205551b4ed75a5a12e2dd49e70b723.png~tplv-obj.webp"
    },
    "Candy Loot": {
      local: `${LOCAL_IMAGE_PATH}candy_loot_449.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/942191ca3bdc5b648c725e2800a1c3d2.png~tplv-obj.webp"
    },
  },
  450: {
    "Fairy Mask": {
      local: `${LOCAL_IMAGE_PATH}fairy_mask_450.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/20bfad17835a6d5d369f3e183c10e035.png~tplv-obj.webp"
    },
    "Powerful Mind": {
      local: `${LOCAL_IMAGE_PATH}powerful_mind_450.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2184128b55eaef8a390a1a43a2ffdf16.png~tplv-obj.webp"
    },
    "Hat of Joy": {
      local: `${LOCAL_IMAGE_PATH}hat_of_joy_450.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9fcbc11bf61ee4b5790f2b3677a45ac6.png~tplv-obj.webp"
    },
    "Halloween Fun Hat": {
      local: `${LOCAL_IMAGE_PATH}halloween_fun_hat_450.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/45a573035e301087d1ffe91e0f1513cb.png~tplv-obj.webp"
    },
  },
  499: {
    "Panda Hug": {
      local: `${LOCAL_IMAGE_PATH}panda_hug_499.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6a00e64d9582d0e1f4ef0ac66132c272.png~tplv-obj.webp"
    },
    "Coral": {
      local: `${LOCAL_IMAGE_PATH}coral_499.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d4faa402c32bf4f92bee654b2663d9f1~tplv-obj.webp"
    },
    "Sakura Corgi": {
      local: `${LOCAL_IMAGE_PATH}sakura_corgi_499.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/22566bba8f729d29c40d636ea9d6d9cc.png~tplv-obj.webp"
    },
    "Hands Up": {
      local: `${LOCAL_IMAGE_PATH}hands_up_499.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/f4d906542408e6c87cf0a42f7426f0c6~tplv-obj.webp"
    },
  },
  500: {
    "Money Gun": {
      local: `${LOCAL_IMAGE_PATH}money_gun_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/e0589e95a2b41970f0f30f6202f5fce6~tplv-obj.webp"
    },
    "Autumn Leaves": {
      local: `${LOCAL_IMAGE_PATH}autumn_leaves_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/30adcaf443df63e3bfd2751ad251f87d.png~tplv-obj.webp"
    },
    "You're Amazing": {
      local: `${LOCAL_IMAGE_PATH}youre_amazing_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/b48c69f4df49c28391bcc069bbc31b41.png~tplv-obj.webp"
    },
    "VR Goggles": {
      local: `${LOCAL_IMAGE_PATH}vr_goggles_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/18c51791197b413bbd1b4f1b983bda36.png~tplv-obj.webp"
    },
    "Manifesting": {
      local: `${LOCAL_IMAGE_PATH}manifesting_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/ca11566ae5a41ec8971cc00b51f78dac.png~tplv-obj.webp"
    },
    "DJ Glasses": {
      local: `${LOCAL_IMAGE_PATH}dj_glasses_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/d4aad726e2759e54a924fbcd628ea143.png~tplv-obj.webp"
    },
    "Dragon Crown": {
      local: `${LOCAL_IMAGE_PATH}dragon_crown_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/1d3f3738f57d6a45dd6df904bedd59ae.png~tplv-obj.webp"
    },
    "Star Map Polaris": {
      local: `${LOCAL_IMAGE_PATH}star_map_polaris_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6abb39fb8088a1897b8163e54394845c.png~tplv-obj.webp"
    },
    "Bouquet": {
      local: `${LOCAL_IMAGE_PATH}bouquet_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/f1ead695e8281b7387e40d48fc6b1fb0.png~tplv-obj.webp"
    },
    "Racing Helmet": {
      local: `${LOCAL_IMAGE_PATH}racing_helmet_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b9321d0563504990e8fcf73466f4c895.png~tplv-obj.webp"
    },
    "Prince": {
      local: `${LOCAL_IMAGE_PATH}prince_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ea1fc9cb68514ec3c844179c6f09e8de.png~tplv-obj.webp"
    },
    "Bunny Crown": {
      local: `${LOCAL_IMAGE_PATH}bunny_crown_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/296fc5bf7a4df1db6de50d80414c5407.png~tplv-obj.webp"
    },
    "Magic Prop": {
      local: `${LOCAL_IMAGE_PATH}magic_prop_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/51b0adff1cf290651c87ec26128658b9.png~tplv-obj.webp"
    },
    "Cheeky Boo": {
      local: `${LOCAL_IMAGE_PATH}cheeky_boo_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ee8ad03b1b2da2929547cf9ae599bc92.png~tplv-obj.webp"
    },
    "Star Warmup": {
      local: `${LOCAL_IMAGE_PATH}star_warmup_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ba856cdb64097394b725643f2fcbac19.png~tplv-obj.webp"
    },
    "Gem Gun": {
      local: `${LOCAL_IMAGE_PATH}gem_gun_500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/dd06007ade737f1001977590b11d3f61~tplv-obj.webp"
    },
  },
  600: {
    "Join Butterflies": {
      local: `${LOCAL_IMAGE_PATH}join_butterflies_600.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/79afcda7ceb1228d393f4987e12a857c.png~tplv-obj.webp"
    },
  },
  699: {
    "Swan": {
      local: `${LOCAL_IMAGE_PATH}swan_699.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/97a26919dbf6afe262c97e22a83f4bf1~tplv-obj.webp"
    },
  },
  700: {
    "Colorful Wings": {
      local: `${LOCAL_IMAGE_PATH}colorful_wings_700.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/67f29babb4506da83fed2d9143e6079b.png~tplv-obj.webp"
    },
  },
  799: {
    "Trash Panda": {
      local: `${LOCAL_IMAGE_PATH}trash_panda_799.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/706c0c2928fadf0682e1678bc7f336dc.png~tplv-obj.webp"
    },
  },
  899: {
    "LOVE U": {
      local: `${LOCAL_IMAGE_PATH}love_u_899.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/79d45877691333e2ba69a9098406e95c.png~tplv-obj.webp"
    },
    "Train": {
      local: `${LOCAL_IMAGE_PATH}train_899.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4227ed71f2c494b554f9cbe2147d4899~tplv-obj.webp"
    },
  },
  900: {
    "Superstar": {
      local: `${LOCAL_IMAGE_PATH}superstar_900.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/28ca7ac8e7c2359d4ae933fc37e340f8.png~tplv-obj.webp"
    },
  },
  999: {
    "Travel with You": {
      local: `${LOCAL_IMAGE_PATH}travel_with_you_999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/753098e5a8f45afa965b73616c04cf89~tplv-obj.webp"
    },
    "Lucky Airdrop Box": {
      local: `${LOCAL_IMAGE_PATH}lucky_airdrop_box_999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6ae56f08ae3ee57ea2dda0025bfd39d3.png~tplv-obj.webp"
    },
    "Grand show": {
      local: `${LOCAL_IMAGE_PATH}grand_show_999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/61348c8f1a776122088de3d43fc16fab.png~tplv-obj.webp"
    },
    "Trending Figure": {
      local: `${LOCAL_IMAGE_PATH}trending_figure_999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/df7b556ccf369bf9a42fe83ec8a77acf.png~tplv-obj.webp"
    },
  },
  1000: {
    "Gold Mine": {
      local: `${LOCAL_IMAGE_PATH}gold_mine_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/58cbff1bd592ae4365a450c4bf767f3a.png~tplv-obj.webp"
    },
    "Watermelon Love": {
      local: `${LOCAL_IMAGE_PATH}watermelon_love_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/1d1650cd9bb0e39d72a6e759525ffe59~tplv-obj.webp"
    },
    "Dinosaur": {
      local: `${LOCAL_IMAGE_PATH}dinosaur_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/e1b0687ef6df9d6db8222831d353fcf9.png~tplv-obj.webp"
    },
    "Glowing Jellyfish": {
      local: `${LOCAL_IMAGE_PATH}glowing_jellyfish_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/96d9226ef1c33784a24d0779ad3029d3.png~tplv-obj.webp"
    },
    "Blooming Ribbons": {
      local: `${LOCAL_IMAGE_PATH}blooming_ribbons_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/f76750ab58ee30fc022c9e4e11d25c9d.png~tplv-obj.webp"
    },
    "Galaxy": {
      local: `${LOCAL_IMAGE_PATH}galaxy_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp"
    },
    "Fairy Wings": {
      local: `${LOCAL_IMAGE_PATH}fairy_wings_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d9798af8e406e718e66322caddf04440.png~tplv-obj.webp"
    },
    "Flamingo Groove": {
      local: `${LOCAL_IMAGE_PATH}flamingo_groove_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ef1e4cf78bb27e6164f53e1695e7a5bc.png~tplv-obj.webp"
    },
    "Cooper Baseball": {
      local: `${LOCAL_IMAGE_PATH}cooper_baseball_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/8dd38d31d771b6df30a5fbebf99cd7c1.png~tplv-obj.webp"
    },
    "Super LIVE Star": {
      local: `${LOCAL_IMAGE_PATH}super_live_star_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/cd57ce260b2537e2a8ed056431b267f2.png~tplv-obj.webp"
    },
    "Sparkle Dance": {
      local: `${LOCAL_IMAGE_PATH}sparkle_dance_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6d934aacf296e6f24d75b8b2aa4fb22f.png~tplv-obj.webp"
    },
    "Shiny air balloon": {
      local: `${LOCAL_IMAGE_PATH}shiny_air_balloon_1000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9e7ebdca64b8f90fcc284bb04ab92d24~tplv-obj.webp"
    },
  },
  1031: {
    "Pumpkin Carriage": {
      local: `${LOCAL_IMAGE_PATH}pumpkin_carriage_1031.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/c7d1e2eabf5c93d76902278b3292f196~tplv-obj.webp"
    },
  },
  1088: {
    "Fireworks": {
      local: `${LOCAL_IMAGE_PATH}fireworks_1088.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9494c8a0bc5c03521ef65368e59cc2b8~tplv-obj.webp"
    },
    "Magic Role": {
      local: `${LOCAL_IMAGE_PATH}magic_role_1088.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/690125ff0a089e5dfc2721d6a6f35fa9.png~tplv-obj.webp"
    },
  },
  1099: {
    "Diamond": {
      local: `${LOCAL_IMAGE_PATH}diamond_1099.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/55ee5e871f7f413d24521f824682bb10.png~tplv-obj.webp"
    },
  },
  1200: {
    "Travel in the US": {
      local: `${LOCAL_IMAGE_PATH}travel_in_the_us_1200.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/939e7bd183b16b711809d0d6ca03d314~tplv-obj.webp"
    },
    "Umbrella of Love": {
      local: `${LOCAL_IMAGE_PATH}umbrella_of_love_1200.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3b1e8de86d841496b87567014827537b.png~tplv-obj.webp"
    },
    "Starlight Sceptre": {
      local: `${LOCAL_IMAGE_PATH}starlight_sceptre_1200.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/bcb3636b904fe6050d6a47efb1eafd2c.png~tplv-obj.webp"
    },
  },
  1400: {
    "Vibrant Stage": {
      local: `${LOCAL_IMAGE_PATH}vibrant_stage_1400.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ae0a1abca4313c916e2a4e40813d90d6.png~tplv-obj.webp"
    },
  },
  1500: {
    "Level Ship": {
      local: `${LOCAL_IMAGE_PATH}level_ship_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/61863cebe02f25d95f187d3b0033718d.png~tplv-obj.webp"
    },
    "Chasing the Dream": {
      local: `${LOCAL_IMAGE_PATH}chasing_the_dream_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/1ea8dbb805466c4ced19f29e9590040f~tplv-obj.webp"
    },
    "Lover's Lock": {
      local: `${LOCAL_IMAGE_PATH}lovers_lock_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/f3010d1fcb008ce1b17248e5ea18b178.png~tplv-obj.webp"
    },
    "Greeting Card": {
      local: `${LOCAL_IMAGE_PATH}greeting_card_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/dac91f95d4135654fe16d09369dd8355.png~tplv-obj.webp"
    },
    "Future Encounter": {
      local: `${LOCAL_IMAGE_PATH}future_encounter_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/af980f4ec9ed73f3229df8dfb583abe6.png~tplv-obj.webp"
    },
    "EWC Trophy": {
      local: `${LOCAL_IMAGE_PATH}ewc_trophy_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7f624200a613979597a9b729cf0b5e40.png~tplv-obj.webp"
    },
    "Under Control": {
      local: `${LOCAL_IMAGE_PATH}under_control_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/af67b28480c552fd8e8c0ae088d07a1d.png~tplv-obj.webp"
    },
    "Racing Debut": {
      local: `${LOCAL_IMAGE_PATH}racing_debut_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b5ac8bb9da5569185bfdc1be357d3906.png~tplv-obj.webp"
    },
    "Galaxy Globe": {
      local: `${LOCAL_IMAGE_PATH}galaxy_globe_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/1379dd334a16615a8731a3a4f97b932f.png~tplv-obj.webp"
    },
    "Viking Hammer": {
      local: `${LOCAL_IMAGE_PATH}viking_hammer_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5b95101816bc9f61f65bd265641ef4d6.png~tplv-obj.webp"
    },
    "Twirl & Treat": {
      local: `${LOCAL_IMAGE_PATH}twirl_treat_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/7b2cfbddcfb1f318e255a23ae44c3670.png~tplv-obj.webp"
    },
    "Merry Go Boo": {
      local: `${LOCAL_IMAGE_PATH}merry_go_boo_1500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/3bd4fdaaac182c44c4717e24f2d11db3.png~tplv-obj.webp"
    },
  },
  1599: {
    "Blooming Heart": {
      local: `${LOCAL_IMAGE_PATH}blooming_heart_1599.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ff5453b7569d482c873163ce4b1fb703.png~tplv-obj.webp"
    },
  },
  1799: {
    "Here We Go": {
      local: `${LOCAL_IMAGE_PATH}here_we_go_1799.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/61b76a51a3757f0ff1cdc33b16c4d8ae~tplv-obj.webp"
    },
  },
  1800: {
    "Love Drop": {
      local: `${LOCAL_IMAGE_PATH}love_drop_1800.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/1ea684b3104abb725491a509022f7c02~tplv-obj.webp"
    },
    "Fox Legend": {
      local: `${LOCAL_IMAGE_PATH}fox_legend_1800.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fac01b1cc3a676a38e749959faca9fb2.png~tplv-obj.webp"
    },
  },
  1999: {
    "Cable Car": {
      local: `${LOCAL_IMAGE_PATH}cable_car_1999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/fa6b6c6d8dcb9bedf8dda904ea421f84.png~tplv-obj.webp"
    },
    "Star of Red Carpet": {
      local: `${LOCAL_IMAGE_PATH}star_of_red_carpet_1999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/5b9bf90278f87b9ca0c286d3c8a12936~tplv-obj.webp"
    },
    "Gift Box": {
      local: `${LOCAL_IMAGE_PATH}gift_box_1999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9cc22f7c8ac233e129dec7b981b91b76~tplv-obj.webp"
    },
    "Cooper Flies Home": {
      local: `${LOCAL_IMAGE_PATH}cooper_flies_home_1999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f1945b0d96e665a759f747e5e0cf7a9~tplv-obj.webp"
    },
    "Mystery Firework": {
      local: `${LOCAL_IMAGE_PATH}mystery_firework_1999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/c110230c5db903db5f060a432f5a86cd~tplv-obj.webp"
    },
  },
  2000: {
    "Baby Dragon": {
      local: `${LOCAL_IMAGE_PATH}baby_dragon_2000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/733030ca95fe6f757533aec40bf2af3a.png~tplv-obj.webp"
    },
    "Crystal Crown": {
      local: `${LOCAL_IMAGE_PATH}crystal_crown_2000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/4f7f618d209c8fb1f99757a42f65fa71.png~tplv-obj.webp"
    },
    "Cooper Picnic": {
      local: `${LOCAL_IMAGE_PATH}cooper_picnic_2000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/23b24ff52e8c8129bf2080ac306fc7e3.png~tplv-obj.webp"
    },
  },
  2150: {
    "Whale Diving": {
      local: `${LOCAL_IMAGE_PATH}whale_diving_2150.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/46fa70966d8e931497f5289060f9a794~tplv-obj.webp"
    },
  },
  2199: {
    "Blow Rosie Kisses": {
      local: `${LOCAL_IMAGE_PATH}blow_rosie_kisses_2199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/710076b6be7de742f800c4ab88fab9ff.png~tplv-obj.webp"
    },
    "Jollie's Heartland": {
      local: `${LOCAL_IMAGE_PATH}jollies_heartland_2199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/0eafd5c28cdb2563f3386679643abb29.png~tplv-obj.webp"
    },
    "Rocky's Punch": {
      local: `${LOCAL_IMAGE_PATH}rockys_punch_2199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d17fb8a57c708c4f07f95884131df654.png~tplv-obj.webp"
    },
    "Sage's Coinbot": {
      local: `${LOCAL_IMAGE_PATH}sages_coinbot_2199.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/443c163954f4f7636909fb6980518745.png~tplv-obj.webp"
    },
  },
  2500: {
    "Animal Band": {
      local: `${LOCAL_IMAGE_PATH}animal_band_2500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/60d8c4148c9cd0c268e570741ccf4150.png~tplv-obj.webp"
    },
  },
  2988: {
    "Motorcycle": {
      local: `${LOCAL_IMAGE_PATH}motorcycle_2988.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6517b8f2f76dc75ff0f4f73107f8780e~tplv-obj.webp"
    },
  },
  2999: {
    "Rhythmic Bear": {
      local: `${LOCAL_IMAGE_PATH}rhythmic_bear_2999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/16eacf541e4bd6816e88139d079519f5.png~tplv-obj.webp"
    },
    "Level-up Spotlight": {
      local: `${LOCAL_IMAGE_PATH}levelup_spotlight_2999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/9a87567b4bb63b175f146745af412bb5.png~tplv-obj.webp"
    },
  },
  3000: {
    "Meteor Shower": {
      local: `${LOCAL_IMAGE_PATH}meteor_shower_3000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/71883933511237f7eaa1bf8cd12ed575~tplv-obj.webp"
    },
  },
  3999: {
    "Gift Box": {
      local: `${LOCAL_IMAGE_PATH}gift_box_3999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3646c259f8ce6f79c762ad00ce51dda0~tplv-obj.webp"
    },
  },
  4088: {
    "Magic World": {
      local: `${LOCAL_IMAGE_PATH}magic_world_4088.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/a91fdba590b29bab1287ec746d8323a8.png~tplv-obj.webp"
    },
  },
  4500: {
    "Your Concert": {
      local: `${LOCAL_IMAGE_PATH}your_concert_4500.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/86c9c8fb5aa76488b075f139dd575dfe.png~tplv-obj.webp"
    },
  },
  4888: {
    "Private Jet": {
      local: `${LOCAL_IMAGE_PATH}private_jet_4888.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/921c6084acaa2339792052058cbd3fd3~tplv-obj.webp"
    },
    "Leon the Kitten": {
      local: `${LOCAL_IMAGE_PATH}leon_the_kitten_4888.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a7748baba012c9e2d98a30dce7cc5a27~tplv-obj.webp"
    },
    "Fiery Dragon": {
      local: `${LOCAL_IMAGE_PATH}fiery_dragon_4888.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/8d1281789de0a5dfa69f90ecf0dc1534.png~tplv-obj.webp"
    },
    "Signature Jet": {
      local: `${LOCAL_IMAGE_PATH}signature_jet_4888.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/fe27eba54a50c0a687e3dc0f2c02067d~tplv-obj.webp"
    },
  },
  4999: {
    "Sage's Venture": {
      local: `${LOCAL_IMAGE_PATH}sages_venture_4999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/ea291160b9b69dc5d13938433ba0fae9.png~tplv-obj.webp"
    },
  },
  5000: {
    "Unicorn Fantasy": {
      local: `${LOCAL_IMAGE_PATH}unicorn_fantasy_5000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/483c644e67e9bb1dd5970f2df00b7576~tplv-obj.webp"
    },
    "Flying Jets": {
      local: `${LOCAL_IMAGE_PATH}flying_jets_5000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/1d067d13988e8754ed6adbebd89b9ee8.png~tplv-obj.webp"
    },
    "Diamond Gun": {
      local: `${LOCAL_IMAGE_PATH}diamond_gun_5000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/651e705c26b704d03bc9c06d841808f1.png~tplv-obj.webp"
    },
    "Scarecrow": {
      local: `${LOCAL_IMAGE_PATH}scarecrow_5000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/8ab9284702b21ec543481bed03da121c.png~tplv-obj.webp"
    },
    "Wolf": {
      local: `${LOCAL_IMAGE_PATH}wolf_5000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/002d5e13fd6cd18b7574b43dc4fd13ae.png~tplv-obj.webp"
    },
  },
  5999: {
    "Devoted Heart": {
      local: `${LOCAL_IMAGE_PATH}devoted_heart_5999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/bc3e9b4ce077044956fee2ded85f8ff7.png~tplv-obj.webp"
    },
  },
  6000: {
    "Future City": {
      local: `${LOCAL_IMAGE_PATH}future_city_6000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/963b7c25aa2cedc0de22358342645e87.png~tplv-obj.webp"
    },
    "Sam in New City": {
      local: `${LOCAL_IMAGE_PATH}sam_in_new_city_6000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/291de897e4a8c3b72c358a9734c5b7d8.png~tplv-obj.webp"
    },
    "Work Hard Play Harder": {
      local: `${LOCAL_IMAGE_PATH}work_hard_play_harder_6000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3257e15b3f6697aed88b4ac51b816603.png~tplv-obj.webp"
    },
    "Strong Finish": {
      local: `${LOCAL_IMAGE_PATH}strong_finish_6000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9ad035b088dfeaf298fdc9cd84d50000.png~tplv-obj.webp"
    },
    "Boo Crew": {
      local: `${LOCAL_IMAGE_PATH}boo_crew_6000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5bb94d02865d181d7da2ba0f3c145e02.png~tplv-obj.webp"
    },
    "Peek-a-Boo": {
      local: `${LOCAL_IMAGE_PATH}peekaboo_6000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/2e41485ff4bafabbbf0494969302b83c.png~tplv-obj.webp"
    },
  },
  6599: {
    "Lili the Leopard": {
      local: `${LOCAL_IMAGE_PATH}lili_the_leopard_6599.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7be03e1af477d1dbc6eb742d0c969372.png~tplv-obj.webp"
    },
  },
  6999: {
    "Happy Party": {
      local: `${LOCAL_IMAGE_PATH}happy_party_6999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/41774a8ba83c59055e5f2946d51215b4~tplv-obj.webp"
    },
  },
  7000: {
    "Illumination": {
      local: `${LOCAL_IMAGE_PATH}illumination_7000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/7d8146fc5f932ccc087d89f001b48f12.png~tplv-obj.webp"
    },
    "Sports Car": {
      local: `${LOCAL_IMAGE_PATH}sports_car_7000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/e7ce188da898772f18aaffe49a7bd7db~tplv-obj.webp"
    },
  },
  7999: {
    "Star Throne": {
      local: `${LOCAL_IMAGE_PATH}star_throne_7999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/30063f6bc45aecc575c49ff3dbc33831~tplv-obj.webp"
    },
  },
  9699: {
    "Leon and Lili": {
      local: `${LOCAL_IMAGE_PATH}leon_and_lili_9699.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/6958244f3eeb69ce754f735b5833a4aa.png~tplv-obj.webp"
    },
  },
  10000: {
    "Interstellar": {
      local: `${LOCAL_IMAGE_PATH}interstellar_10000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8520d47b59c202a4534c1560a355ae06~tplv-obj.webp"
    },
    "Sunset Speedway": {
      local: `${LOCAL_IMAGE_PATH}sunset_speedway_10000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/df63eee488dc0994f6f5cb2e65f2ae49~tplv-obj.webp"
    },
  },
  12000: {
    "Red Lightning": {
      local: `${LOCAL_IMAGE_PATH}red_lightning_12000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/5f48599c8d2a7bbc6e6fcf11ba2c809f~tplv-obj.webp"
    },
    "Convertible": {
      local: `${LOCAL_IMAGE_PATH}convertible_12000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c515a8ff12674d6bd97b3b29ad83ed9a.png~tplv-obj.webp"
    },
  },
  12999: {
    "Level-up Spectacle": {
      local: `${LOCAL_IMAGE_PATH}levelup_spectacle_12999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/52a09724bbe8d78227db67bc5fe78613.png~tplv-obj.webp"
    },
  },
  14999: {
    "Scythe of Justice": {
      local: `${LOCAL_IMAGE_PATH}scythe_of_justice_14999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5d5ced6572464c1cf2b0deb92845014b.png~tplv-obj.webp"
    },
    "Storm Blade": {
      local: `${LOCAL_IMAGE_PATH}storm_blade_14999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/d18ee809ac8b5198a34d05f1392c0dfa.png~tplv-obj.webp"
    },
    "Crystal Heart": {
      local: `${LOCAL_IMAGE_PATH}crystal_heart_14999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/08095e18ae3da6ad5dcf23ce68eb1483.png~tplv-obj.webp"
    },
  },
  15000: {
    "Bran Castle": {
      local: `${LOCAL_IMAGE_PATH}bran_castle_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/849e3f5245b978b86cec663d202db2f6.png~tplv-obj.webp"
    },
    "Leopard": {
      local: `${LOCAL_IMAGE_PATH}leopard_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/3d837cfcac70929abc0f45e4dc7cee04.png~tplv-obj.webp"
    },
    "Rosa Nebula": {
      local: `${LOCAL_IMAGE_PATH}rosa_nebula_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/f722088231103b66875dae33f13f8719.png~tplv-obj.webp"
    },
    "Pyramids": {
      local: `${LOCAL_IMAGE_PATH}pyramids_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/9550df3089a6d20e06391df8d9b15392.png~tplv-obj.webp"
    },
    "Future Journey": {
      local: `${LOCAL_IMAGE_PATH}future_journey_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/dd615b15ed696ee886064d5415dab688.png~tplv-obj.webp"
    },
    "Party On&On": {
      local: `${LOCAL_IMAGE_PATH}party_onon_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/c45505ece4a91d9c43e4ba98a000b006.png~tplv-obj.webp"
    },
    "Turkey Trot": {
      local: `${LOCAL_IMAGE_PATH}turkey_trot_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/61e052e303e902c676f44e9ff2f027fc.png~tplv-obj.webp"
    },
    "Boo Town": {
      local: `${LOCAL_IMAGE_PATH}boo_town_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9e1b881caee0abcdd6744e151997ed02.png~tplv-obj.webp"
    },
    "Spookville": {
      local: `${LOCAL_IMAGE_PATH}spookville_15000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/9c9f9a4376cc59f6eefe15306e6405fc.png~tplv-obj.webp"
    },
  },
  17000: {
    "Amusement Park": {
      local: `${LOCAL_IMAGE_PATH}amusement_park_17000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/12ecc01c2984c5d85bb508e80103a3cb.png~tplv-obj.webp"
    },
  },
  19999: {
    "Fly Love": {
      local: `${LOCAL_IMAGE_PATH}fly_love_19999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a598ba4c7024f4d46c1268be4d82f901~tplv-obj.webp"
    },
  },
  20000: {
    "TikTok Shuttle": {
      local: `${LOCAL_IMAGE_PATH}tiktok_shuttle_20000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8ef48feba8dd293a75ae9d4376fb17c9~tplv-obj.webp"
    },
    "Castle Fantasy": {
      local: `${LOCAL_IMAGE_PATH}castle_fantasy_20000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8173e9b07875cca37caa5219e4903a40~tplv-obj.webp"
    },
    "Premium Shuttle": {
      local: `${LOCAL_IMAGE_PATH}premium_shuttle_20000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/c2b287adee5151b7889d6e3d45b72e44~tplv-obj.webp"
    },
  },
  21000: {
    "Level Ship": {
      local: `${LOCAL_IMAGE_PATH}level_ship_21000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/aca72c59f99d08b0c0d1cd6cc79dbb16.png~tplv-obj.webp"
    },
  },
  23999: {
    "Infinite Heart": {
      local: `${LOCAL_IMAGE_PATH}infinite_heart_23999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/de31974d7a94525c6f31872b5b38f76e.png~tplv-obj.webp"
    },
  },
  25999: {
    "Gate of Trial": {
      local: `${LOCAL_IMAGE_PATH}gate_of_trial_25999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/0a36e4896f5d60399a8389c043a23edf.png~tplv-obj.webp"
    },
    "Phoenix": {
      local: `${LOCAL_IMAGE_PATH}phoenix_25999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/ef248375c4167d70c1642731c732c982~tplv-obj.webp"
    },
    "Adam's Dream": {
      local: `${LOCAL_IMAGE_PATH}adams_dream_25999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9a586391fbb1e21621c4203e5563a9e0~tplv-obj.webp"
    },
    "Greatsword Temple": {
      local: `${LOCAL_IMAGE_PATH}greatsword_temple_25999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/11184a62a81905d6cfc8ae77d3fe0e80.png~tplv-obj.webp"
    },
  },
  26999: {
    "Dragon Flame": {
      local: `${LOCAL_IMAGE_PATH}dragon_flame_26999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/89b4d1d93c1cc614e3a0903ac7a94e0c~tplv-obj.webp"
    },
  },
  29999: {
    "Lion": {
      local: `${LOCAL_IMAGE_PATH}lion_29999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4fb89af2082a290b37d704e20f4fe729~tplv-obj.webp"
    },
  },
  34000: {
    "Leon and Lion": {
      local: `${LOCAL_IMAGE_PATH}leon_and_lion_34000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a291aedacf27d22c3fd2d83575d2bee9~tplv-obj.webp"
    },
    "Zeus": {
      local: `${LOCAL_IMAGE_PATH}zeus_34000.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/01793f9afe15f5037a9dc10435c37c85.png~tplv-obj.webp"
    },
  },
  34999: {
    "TikTok Universe+": {
      local: `${LOCAL_IMAGE_PATH}tiktok_universe_34999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/b13105782e8bf8fbefaa83b7af413cee~tplv-obj.webp"
    },
  },
  39999: {
    "TikTok Stars": {
      local: `${LOCAL_IMAGE_PATH}tiktok_stars_39999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/b1667c891ed39fd68ba7252fff7a1e7c~tplv-obj.webp"
    },
    "Thunder Falcon": {
      local: `${LOCAL_IMAGE_PATH}thunder_falcon_39999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/26f3fbcda383e6093a19b8e7351a164c~tplv-obj.webp"
    },
  },
  41999: {
    "Fire Phoenix": {
      local: `${LOCAL_IMAGE_PATH}fire_phoenix_41999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/bfb8425a7e8fa03f9fec05a973a4a506.png~tplv-obj.webp"
    },
  },
  42999: {
    "King of Legends": {
      local: `${LOCAL_IMAGE_PATH}king_of_legends_42999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/3790b60a52697daa138bf8d0ec27242f.png~tplv-obj.webp"
    },
    "Valerian's Oath": {
      local: `${LOCAL_IMAGE_PATH}valerians_oath_42999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/27408e0429e288fc735e9f010da9fcf3.png~tplv-obj.webp"
    },
    "Pegasus": {
      local: `${LOCAL_IMAGE_PATH}pegasus_42999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/f600a2495ab5d250e7da2066484a9383.png~tplv-obj.webp"
    },
  },
  44999: {
    "TikTok Universe": {
      local: `${LOCAL_IMAGE_PATH}tiktok_universe_44999.webp`,
      cdn: "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8f471afbcebfda3841a6cc515e381f58~tplv-obj.webp"
    },
  }
};

// Get image URL for a gift (prioritizes downloaded, then bundled, then CDN)
// Priority: 1) Downloaded images (userData) 2) Bundled images 3) CDN
function getGiftImageUrl(giftName, coinValue, preferLocal = true) {
  if (GIFT_IMAGES[coinValue] && GIFT_IMAGES[coinValue][giftName]) {
    const giftData = GIFT_IMAGES[coinValue][giftName];

    // If it's the new structure with local/cdn
    if (typeof giftData === 'object' && giftData.local) {
      // Check if downloaded images are available first
      if (preferLocal && DOWNLOADED_IMAGES_PATH) {
        const sanitized = sanitizeForFilename(giftName);
        const filename = `${sanitized}_${coinValue}.webp`;
        // Use file:// protocol to access downloaded images
        return `file:///${DOWNLOADED_IMAGES_PATH.replace(/\\/g, '/')}/${filename}`;
      }

      // For local-first use (overlay HTML), return bundled local path
      // The CDN URL is available as fallback if needed
      if (preferLocal) {
        return giftData.local;
      }
      // For previews, prefer CDN to avoid loading issues
      return giftData.cdn || giftData.local;
    }

    // Legacy structure (direct URL string)
    return giftData;
  }

  // Try to generate local path if it exists
  if (preferLocal) {
    const sanitized = sanitizeForFilename(giftName);

    // Check downloaded path first
    if (DOWNLOADED_IMAGES_PATH) {
      return `file:///${DOWNLOADED_IMAGES_PATH.replace(/\\/g, '/')}/${sanitized}_${coinValue}.webp`;
    }

    return `${LOCAL_IMAGE_PATH}${sanitized}_${coinValue}.webp`;
  }

  return null;
}

// Helper function to handle image loading with CDN fallback
// Usage: <img src="..." onerror="handleImageError(this, giftName, coinValue)">
function handleImageError(imgElement, giftName, coinValue) {
  // If local image fails, try CDN
  const cdnUrl = getGiftImageCDN(giftName, coinValue);
  if (cdnUrl && imgElement.src !== cdnUrl) {
    console.log(`Local image failed for ${giftName}, falling back to CDN`);
    imgElement.src = cdnUrl;
  } else {
    // No CDN fallback available, show placeholder
    imgElement.alt = `${giftName} (${coinValue} coins)`;
    imgElement.style.display = 'none';
  }
}

// Get CDN URL for gift (for use in Gift Images tab preview)
function getGiftImageCDN(giftName, coinValue) {
  if (GIFT_IMAGES[coinValue] && GIFT_IMAGES[coinValue][giftName]) {
    const giftData = GIFT_IMAGES[coinValue][giftName];
    if (typeof giftData === 'object' && giftData.cdn) {
      return giftData.cdn;
    }
    if (typeof giftData === 'string') {
      return giftData;
    }
  }
  return null;
}

// Check if a gift has an image
function hasGiftImage(giftName, coinValue) {
  return GIFT_IMAGES[coinValue] && GIFT_IMAGES[coinValue][giftName] !== undefined;
}

// Add a custom gift image URL (for user-added gifts)
function addCustomGiftImage(giftName, coinValue, imageUrl) {
  if (!GIFT_IMAGES[coinValue]) {
    GIFT_IMAGES[coinValue] = {};
  }

  // Support both local and CDN structure
  if (imageUrl.startsWith('http')) {
    // It's a CDN URL
    GIFT_IMAGES[coinValue][giftName] = {
      local: `${LOCAL_IMAGE_PATH}${sanitizeForFilename(giftName)}_${coinValue}.webp`,
      cdn: imageUrl
    };
  } else {
    // It's a local path
    GIFT_IMAGES[coinValue][giftName] = {
      local: imageUrl,
      cdn: null
    };
  }
}

// Initialize downloaded images path on load
if (typeof window !== 'undefined' && window.sniAPI) {
  window.sniAPI.getDownloadedImagesPath().then(result => {
    if (result.success) {
      setDownloadedImagesPath(result.path);
    }
  }).catch(err => {
    console.error('Failed to get downloaded images path:', err);
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GIFT_IMAGES,
    GIFT_IMAGE_BASE_CDN,
    LOCAL_IMAGE_PATH,
    getGiftImageUrl,
    getGiftImageCDN,
    hasGiftImage,
    addCustomGiftImage,
    sanitizeForFilename,
    handleImageError,
    setDownloadedImagesPath
  };
}
