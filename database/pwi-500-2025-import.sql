-- ============================================
-- HOTTAG: PWI 500 2025 Import
-- Run AFTER migration-pwi-ranking.sql
-- ============================================

-- First, clear any existing PWI rankings
UPDATE wrestlers SET pwi_ranking = NULL WHERE pwi_ranking IS NOT NULL;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jon Moxley', 'jon-moxley', 2)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 2;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Adam Page', 'adam-page', 4)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 4;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hirooki Goto', 'hirooki-goto', 5)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 5;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Swerve Strickland', 'swerve-strickland', 7)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 7;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Místico', 'mistico', 9)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 9;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Will Ospreay', 'will-ospreay', 10)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 10;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kazuchika Okada', 'kazuchika-okada', 11)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 11;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Zack Sabre Jr.', 'zack-sabre-jr', 13)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 13;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bandido', 'bandido', 16)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 16;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Konosuke Takeshita', 'konosuke-takeshita', 17)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 17;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Nic Nemeth', 'nic-nemeth', 21)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 21;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mascara Dorada', 'mascara-dorada', 23)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 23;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Masha Slamovich', 'masha-slamovich', 25)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 25;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('OZAWA', 'ozawa', 26)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 26;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tetsuya Naito', 'tetsuya-naito', 27)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 27;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mark Briscoe', 'mark-briscoe', 28)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 28;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('MJF', 'mjf', 30)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 30;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yota Tsuji', 'yota-tsuji', 31)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 31;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kyle Fletcher', 'kyle-fletcher', 33)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 33;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Moose', 'moose', 34)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 34;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Gabe Kidd', 'gabe-kidd', 35)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 35;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Luke Jacobs', 'luke-jacobs', 36)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 36;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mike Santana', 'mike-santana', 37)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 37;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jun Saito', 'jun-saito', 38)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 38;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Desperado', 'el-desperado', 39)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 39;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Marcus Mathers', 'marcus-mathers', 40)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 40;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ricochet', 'ricochet', 41)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 41;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Effy', 'effy', 42)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 42;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Thom Latimer', 'thom-latimer', 44)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 44;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Penta', 'penta', 45)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 45;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Matt Riddle', 'matt-riddle', 49)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 49;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mance Warner', 'mance-warner', 50)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 50;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Steve Maclin', 'steve-maclin', 51)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 51;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('1 Called Manders', '1-called-manders', 52)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 52;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Leon Slater', 'leon-slater', 53)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 53;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Adam Cole', 'adam-cole', 55)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 55;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('KENTA', 'kenta', 56)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 56;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shingo Takagi', 'shingo-takagi', 57)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 57;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Krule', 'krule', 58)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 58;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Adam Priest', 'adam-priest', 59)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 59;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Satoshi Kojima', 'satoshi-kojima', 60)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 60;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kenoh', 'kenoh', 61)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 61;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('David Finlay', 'david-finlay', 62)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 62;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Michael Oku', 'michael-oku', 64)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 64;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jack Perry', 'jack-perry', 65)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 65;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Josh Alexander', 'josh-alexander', 67)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 67;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Neon', 'neon', 68)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 68;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ace Austin', 'ace-austin', 69)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 69;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kosei Fujita', 'kosei-fujita', 70)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 70;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hechicero', 'hechicero', 71)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 71;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shota Umino', 'shota-umino', 72)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 72;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ricky Saints', 'ricky-saints', 73)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 73;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Suge D.', 'suge-d', 74)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 74;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mike Bailey', 'mike-bailey', 76)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 76;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tomohiro Ishii', 'tomohiro-ishii', 77)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 77;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Nick Wayne', 'nick-wayne', 78)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 78;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hiroshi Tanahashi', 'hiroshi-tanahashi', 80)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 80;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Daniel Garcia', 'daniel-garcia', 81)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 81;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Matt Tremont', 'matt-tremont', 82)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 82;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Darby Allin', 'darby-allin', 83)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 83;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Lee Moriarty', 'lee-moriarty', 84)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 84;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Octagon Jr.', 'octagon-jr', 85)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 85;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jay White', 'jay-white', 86)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 86;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Rei Saito', 'rei-saito', 87)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 87;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Chris Brookes', 'chris-brookes', 88)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 88;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Solo Sikoa', 'solo-sikoa', 89)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 89;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kaito Kiyomiya', 'kaito-kiyomiya', 90)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 90;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Phantasmo', 'el-phantasmo', 91)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 91;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('YAMATO', 'yamato', 92)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 92;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Davey Boy Smith Jr.', 'davey-boy-smith-jr', 93)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 93;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tony D''Angelo', 'tony-dangelo', 94)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 94;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Carmelo Hayes', 'carmelo-hayes', 95)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 95;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Allie Katch', 'allie-katch', 96)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 96;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Komander', 'komander', 97)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 97;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Joey Janela', 'joey-janela', 98)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 98;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Charli Evans', 'charli-evans', 99)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 99;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mims', 'mims', 100)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 100;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Orange Cassidy', 'orange-cassidy', 101)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 101;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Atlantis Jr.', 'atlantis-jr', 102)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 102;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Lio Rush', 'lio-rush', 103)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 103;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sammy Guevara', 'sammy-guevara', 104)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 104;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hologram', 'hologram', 106)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 106;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Myron Reed', 'myron-reed', 107)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 107;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('JC Mateo', 'jc-mateo', 108)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 108;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Atticus Cogar', 'atticus-cogar', 109)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 109;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Laredo Kid', 'laredo-kid', 110)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 110;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Oleg Boltin', 'oleg-boltin', 111)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 111;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Chad Gable', 'chad-gable', 112)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 112;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Karrion Kross', 'karrion-kross', 113)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 113;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('MAO', 'mao', 114)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 114;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuma Aoyagi', 'yuma-aoyagi', 115)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 115;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Carson Drake', 'carson-drake', 116)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 116;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Man Like DeReiss', 'man-like-dereiss', 117)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 117;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kazusada Higuchi', 'kazusada-higuchi', 118)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 118;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('YO-HEY', 'yo-hey', 119)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 119;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shun Skywalker', 'shun-skywalker', 120)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 120;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Templario', 'templario', 121)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 121;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Psycho Mike', 'psycho-mike', 122)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 122;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mad Dog Connelly', 'mad-dog-connelly', 123)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 123;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Titán', 'titan', 124)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 124;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Claudio Castagnoli', 'claudio-castagnoli', 125)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 125;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Katsuyori Shibata', 'katsuyori-shibata', 126)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 126;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuma Anzai', 'yuma-anzai', 127)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 127;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Wheeler YUTA', 'wheeler-yuta', 128)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 128;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('YOH', 'yoh', 129)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 129;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Max the Impaler', 'max-the-impaler', 130)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 130;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jessica Troy', 'jessica-troy', 131)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 131;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('The Beast Mortos', 'the-beast-mortos', 132)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 132;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jake Something', 'jake-something', 133)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 133;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Alex Kane', 'alex-kane', 134)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 134;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Blake Christian', 'blake-christian', 135)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 135;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sheamus', 'sheamus', 136)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 136;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Great O-Khan', 'great-o-khan', 137)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 137;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Manabu Soya', 'manabu-soya', 139)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 139;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Will Kaven', 'will-kaven', 140)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 140;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jasper Troy', 'jasper-troy', 141)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 141;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kevin Blackwood', 'kevin-blackwood', 142)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 142;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Galeno', 'galeno', 143)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 143;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Xelhua', 'xelhua', 144)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 144;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mustafa Ali', 'mustafa-ali', 145)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 145;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Charlie Dempsey', 'charlie-dempsey', 146)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 146;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Brian Cage', 'brian-cage', 148)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 148;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shelton Benjamin', 'shelton-benjamin', 149)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 149;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Daga', 'daga', 150)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 150;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sha Samuels', 'sha-samuels', 151)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 151;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Eita', 'eita', 152)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 152;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jackson Drake', 'jackson-drake', 153)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 153;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Clark Connors', 'clark-connors', 154)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 154;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Brody King', 'brody-king', 155)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 155;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Andrade', 'andrade', 156)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 156;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('AJ Francis', 'aj-francis', 157)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 157;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Zozaya', 'zozaya', 158)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 158;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kevin Knight', 'kevin-knight', 159)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 159;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tim Bosby', 'tim-bosby', 160)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 160;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Big Damo', 'big-damo', 161)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 161;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sean Legacy', 'sean-legacy', 162)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 162;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Minoru Suzuki', 'minoru-suzuki', 163)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 163;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('TJP', 'tjp', 164)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 164;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Alec Price', 'alec-price', 165)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 165;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kento Miyahara', 'kento-miyahara', 166)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 166;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Hijo del Dr. Wagner Jr.', 'el-hijo-del-dr-wagner-jr', 167)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 167;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kenny Williams', 'kenny-williams', 168)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 168;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Frankie Kazarian', 'frankie-kazarian', 169)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 169;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Alex Taylor', 'alex-taylor', 170)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 170;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Gringo Loco', 'gringo-loco', 171)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 171;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Wes Lee', 'wes-lee', 172)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 172;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Peter Tihanyi', 'peter-tihanyi', 173)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 173;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('AKIRA', 'akira', 174)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 174;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Katsuhiko Nakajima', 'katsuhiko-nakajima', 175)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 175;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Roderick Strong', 'roderick-strong', 176)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 176;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Toru Sugiura', 'toru-sugiura', 177)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 177;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ren Narita', 'ren-narita', 178)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 178;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('SANADA', 'sanada', 179)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 179;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mike D Vecchio', 'mike-d-vecchio', 180)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 180;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hideyoshi Kamitani', 'hideyoshi-kamitani', 181)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 181;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ryohei Oiwa', 'ryohei-oiwa', 182)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 182;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ikuto Hidaka', 'ikuto-hidaka', 184)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 184;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hammerstone', 'hammerstone', 185)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 185;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Richard Holliday', 'richard-holliday', 186)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 186;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ultimo Guerrero', 'ultimo-guerrero', 187)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 187;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Naomichi Marufuji', 'naomichi-marufuji', 188)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 188;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Titus Alexander', 'titus-alexander', 189)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 189;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('John Wayne Murdoch', 'john-wayne-murdoch', 190)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 190;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kaun', 'kaun', 191)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 191;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Caveman Ugg', 'caveman-ugg', 192)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 192;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Matthew Justice', 'matthew-justice', 193)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 193;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Zilla Fatu', 'zilla-fatu', 194)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 194;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jordan Oliver', 'jordan-oliver', 195)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 195;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('BRG', 'brg', 196)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 196;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Junior Benito', 'junior-benito', 197)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 197;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('R-Truth', 'r-truth', 198)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 198;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Darius Carter', 'darius-carter', 199)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 199;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Francesco Akira', 'francesco-akira', 200)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 200;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ludwig Kaiser', 'ludwig-kaiser', 201)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 201;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sam Holloway', 'sam-holloway', 202)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 202;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jonathan Gresham', 'jonathan-gresham', 203)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 203;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Masashi Takeda', 'masashi-takeda', 204)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 204;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Alan Angels', 'alan-angels', 205)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 205;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dragon Lee', 'dragon-lee', 206)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 206;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kaito Ishida', 'kaito-ishida', 207)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 207;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Joseph Fenech Jr.', 'joseph-fenech-jr', 208)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 208;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ahura', 'ahura', 209)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 209;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Channing "Stacks" Lorenzo', 'channing-stacks-lorenzo', 210)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 210;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Nino Bryant', 'nino-bryant', 211)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 211;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('PCO', 'pco', 212)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 212;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Mesias', 'el-mesias', 213)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 213;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Carter BlaQ', 'carter-blaq', 214)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 214;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Megan Bayne', 'megan-bayne', 215)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 215;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Aigle Blanc', 'aigle-blanc', 216)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 216;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Robbie Eagles', 'robbie-eagles', 217)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 217;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Naruki Doi', 'naruki-doi', 218)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 218;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Judas Icarus', 'judas-icarus', 219)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 219;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Lee Johnson', 'lee-johnson', 220)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 220;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Zachary Wentz', 'zachary-wentz', 221)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 221;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Psycho Clown', 'psycho-clown', 222)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 222;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kerry Morton', 'kerry-morton', 223)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 223;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jake Parnell', 'jake-parnell', 224)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 224;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Royce Isaacs', 'royce-isaacs', 225)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 225;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jimmy Townsend', 'jimmy-townsend', 226)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 226;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Eddie Edwards', 'eddie-edwards', 227)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 227;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shinya Aoki', 'shinya-aoki', 228)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 228;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Devon Monroe', 'devon-monroe', 229)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 229;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dragon Dia', 'dragon-dia', 230)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 230;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bronson Reed', 'bronson-reed', 231)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 231;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuya Uemura', 'yuya-uemura', 232)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 232;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('O''Shay Edwards', 'oshay-edwards', 233)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 233;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Crixus', 'crixus', 234)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 234;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jack Jester', 'jack-jester', 235)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 235;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yoshiki Inamura', 'yoshiki-inamura', 236)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 236;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Callum Newman', 'callum-newman', 237)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 237;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jay Lethal', 'jay-lethal', 238)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 238;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tommy Knight', 'tommy-knight', 239)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 239;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Drilla Moloney', 'drilla-moloney', 240)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 240;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Channing Thomas', 'channing-thomas', 241)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 241;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Rohan Raja', 'rohan-raja', 242)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 242;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Laurance Roman', 'laurance-roman', 243)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 243;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kristara', 'kristara', 244)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 244;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('U-T', 'u-t', 245)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 245;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Donovan Dijak', 'donovan-dijak', 246)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 246;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Brick Savage', 'brick-savage', 247)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 247;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dan Tamura', 'dan-tamura', 248)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 248;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jimmy Uso', 'jimmy-uso', 249)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 249;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ricky Knight Jr.', 'ricky-knight-jr', 250)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 250;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('KUSHIDA', 'kushida', 251)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 251;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kody Lane', 'kody-lane', 252)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 252;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tetsuya Endo', 'tetsuya-endo', 253)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 253;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('LaBron Kozone', 'labron-kozone', 254)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 254;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('EVIL', 'evil', 255)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 255;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sammy Diaz', 'sammy-diaz', 256)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 256;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Myles Borne', 'myles-borne', 257)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 257;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Pete Dunne', 'pete-dunne', 258)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 258;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Charles Mason', 'charles-mason', 259)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 259;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bryce Donovan', 'bryce-donovan', 260)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 260;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('EC3', 'ec3', 261)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 261;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Rina Yamashita', 'rina-yamashita', 262)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 262;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ryan Clancy', 'ryan-clancy', 263)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 263;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Eric Young', 'eric-young', 264)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 264;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Averno', 'averno', 265)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 265;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jack Cartwheel', 'jack-cartwheel', 266)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 266;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jamesen Shook', 'jamesen-shook', 267)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 267;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sami Callihan', 'sami-callihan', 268)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 268;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('John Hawking', 'john-hawking', 269)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 269;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ulka Sasaki', 'ulka-sasaki', 270)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 270;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Elijah', 'elijah', 271)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 271;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Anthony Bowens', 'anthony-bowens', 272)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 272;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Willie Mack', 'willie-mack', 273)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 273;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Master Wato', 'master-wato', 274)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 274;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dezmond Cole', 'dezmond-cole', 275)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 275;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ray Gonzalez', 'ray-gonzalez', 276)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 276;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Isaiah Broner', 'isaiah-broner', 277)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 277;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Axel Tischer', 'axel-tischer', 278)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 278;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Starboy Charlie', 'starboy-charlie', 279)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 279;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Taiji Ishimori', 'taiji-ishimori', 280)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 280;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('K. C. Navarro', 'k-c-navarro', 281)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 281;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Zandokan Jr.', 'zandokan-jr', 282)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 282;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Pretty Boy Smooth', 'pretty-boy-smooth', 283)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 283;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mt. Kadeem', 'mt-kadeem', 284)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 284;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jake Crist', 'jake-crist', 285)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 285;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dante Casanova', 'dante-casanova', 286)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 286;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bryan Idol', 'bryan-idol', 287)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 287;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('KJ Orso', 'kj-orso', 288)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 288;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tate Mayfairs', 'tate-mayfairs', 289)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 289;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Travis Williams', 'travis-williams', 290)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 290;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('A. R. Fox', 'a-r-fox', 291)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 291;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Stephen Wolf', 'stephen-wolf', 292)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 292;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Adam Brooks', 'adam-brooks', 293)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 293;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Colby Corino', 'colby-corino', 294)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 294;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Brian Myers', 'brian-myers', 295)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 295;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Darian Bengston', 'darian-bengston', 296)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 296;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Evil Uno', 'evil-uno', 297)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 297;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Paul London', 'paul-london', 298)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 298;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jimmy Lloyd', 'jimmy-lloyd', 299)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 299;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Trey Miguel', 'trey-miguel', 300)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 300;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Gianni Valletta', 'gianni-valletta', 301)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 301;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Karl Fredericks', 'karl-fredericks', 302)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 302;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ryuki Honda', 'ryuki-honda', 303)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 303;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ben Bishop', 'ben-bishop', 304)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 304;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Noah Veil', 'noah-veil', 305)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 305;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Seigo Tachibana', 'seigo-tachibana', 306)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 306;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tavion Heights', 'tavion-heights', 307)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 307;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Michel Plante', 'michel-plante', 308)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 308;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Carlie Bravo', 'carlie-bravo', 309)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 309;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('DMT Azul', 'dmt-azul', 310)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 310;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Braun Strowman', 'braun-strowman', 311)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 311;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Danhausen', 'danhausen', 312)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 312;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Big Dave', 'big-dave', 313)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 313;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Maki Itoh', 'maki-itoh', 314)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 314;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Volador, Jr.', 'volador-jr', 315)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 315;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kal Herro', 'kal-herro', 316)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 316;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ryoya Tanaka', 'ryoya-tanaka', 317)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 317;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Lince Dorado', 'lince-dorado', 318)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 318;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dr. Wagner Jr.', 'dr-wagner-jr', 319)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 319;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Metehan', 'metehan', 320)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 320;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Arez', 'arez', 321)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 321;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bad Dude Tito', 'bad-dude-tito', 322)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 322;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Miyu Yamashita', 'miyu-yamashita', 323)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 323;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Trent Seven', 'trent-seven', 324)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 324;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Raj Dhesi', 'raj-dhesi', 325)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 325;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jason Hotch', 'jason-hotch', 326)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 326;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cara Noir', 'cara-noir', 327)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 327;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ice Williams', 'ice-williams', 328)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 328;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cody Deaner', 'cody-deaner', 329)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 329;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Esfinge', 'esfinge', 330)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 330;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Luis Mante', 'luis-mante', 331)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 331;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Danny Limelight', 'danny-limelight', 332)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 332;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Josh Briggs', 'josh-briggs', 333)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 333;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuya Aoki', 'yuya-aoki', 334)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 334;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Robbie X.', 'robbie-x', 335)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 335;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Camaro Jackson', 'camaro-jackson', 336)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 336;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shuji Ishikawa', 'shuji-ishikawa', 337)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 337;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ninja Mack', 'ninja-mack', 338)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 338;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuki Ueno', 'yuki-ueno', 339)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 339;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Michael Allen Richard Clark', 'michael-allen-richard-clark', 340)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 340;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Madoka Kikuta', 'madoka-kikuta', 341)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 341;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Amira', 'amira', 342)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 342;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jack Morris', 'jack-morris', 343)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 343;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Musashi', 'musashi', 344)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 344;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Charlie Sterling', 'charlie-sterling', 345)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 345;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Goldenboy Santos', 'goldenboy-santos', 346)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 346;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Masa Kitamiya', 'masa-kitamiya', 347)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 347;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Zcion RT1', 'zcion-rt1', 348)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 348;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tom Lawlor', 'tom-lawlor', 349)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 349;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Simon Miller', 'simon-miller', 350)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 350;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Lance Archer', 'lance-archer', 351)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 351;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuko Miyamoto', 'yuko-miyamoto', 352)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 352;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cedric Alexander', 'cedric-alexander', 353)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 353;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Joshua Bishop', 'joshua-bishop', 354)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 354;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('SHO', 'sho', 355)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 355;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Lou Nixon', 'lou-nixon', 356)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 356;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hektor Invictus', 'hektor-invictus', 357)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 357;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bryan Keith', 'bryan-keith', 358)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 358;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Anita Vaughn', 'anita-vaughn', 359)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 359;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hoodfoot', 'hoodfoot', 360)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 360;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hayabusa II', 'hayabusa-ii', 361)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 361;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Otis Cogar', 'otis-cogar', 362)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 362;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Silas Mason', 'silas-mason', 363)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 363;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Fuminori Abe', 'fuminori-abe', 364)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 364;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Levaniel', 'levaniel', 365)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 365;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dillon McQueen', 'dillon-mcqueen', 366)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 366;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ridge Holland', 'ridge-holland', 367)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 367;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jaden Newman', 'jaden-newman', 368)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 368;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shigehiro Irie', 'shigehiro-irie', 369)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 369;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jay', 'jay', 370)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 370;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Alfonso Gonzalez', 'alfonso-gonzalez', 371)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 371;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('The Dark Sheik', 'the-dark-sheik', 372)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 372;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Marius Al-Ani', 'marius-al-ani', 373)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 373;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Q. T. Marshall', 'q-t-marshall', 374)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 374;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Andino', 'andino', 375)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 375;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jeremiah Plunkett', 'jeremiah-plunkett', 376)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 376;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Erik Surge', 'erik-surge', 377)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 377;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Pagano', 'pagano', 378)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 378;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kylie Rae', 'kylie-rae', 379)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 379;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Angel de Oro', 'angel-de-oro', 380)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 380;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kosuke Sato', 'kosuke-sato', 381)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 381;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('T. J. Crawford', 't-j-crawford', 382)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 382;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('HAYATA', 'hayata', 383)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 383;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Calvin Tankman', 'calvin-tankman', 384)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 384;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Billie Starkz', 'billie-starkz', 385)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 385;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yuki Ino', 'yuki-ino', 386)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 386;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Rhino', 'rhino', 387)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 387;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Connor Mills', 'connor-mills', 388)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 388;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Daron Richardson', 'daron-richardson', 389)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 389;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kid Lykos', 'kid-lykos', 390)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 390;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Timothy Thatcher', 'timothy-thatcher', 391)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 391;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Seiki Yoshioka', 'seiki-yoshioka', 392)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 392;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Leo Sparrow', 'leo-sparrow', 393)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 393;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bobby Flaco', 'bobby-flaco', 394)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 394;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Matt Taven', 'matt-taven', 395)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 395;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Real1', 'real1', 396)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 396;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Pedro Portillo III', 'pedro-portillo-iii', 397)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 397;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kuro', 'kuro', 398)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 398;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bobby Beverly', 'bobby-beverly', 399)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 399;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cappuccino Jones', 'cappuccino-jones', 400)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 400;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('J-BOUJII', 'j-boujii', 401)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 401;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Lindaman', 'el-lindaman', 402)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 402;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Erron Wade', 'erron-wade', 403)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 403;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Chad Daniels', 'chad-daniels', 404)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 404;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Charles Crowley', 'charles-crowley', 405)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 405;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mentallo', 'mentallo', 406)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 406;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sidney Akeem', 'sidney-akeem', 407)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 407;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Sam Stackhouse', 'sam-stackhouse', 408)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 408;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yumehito Imanari', 'yumehito-imanari', 409)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 409;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Keita Murray', 'keita-murray', 410)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 410;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jody Threat', 'jody-threat', 411)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 411;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jun Kasai', 'jun-kasai', 412)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 412;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('BEEF', 'beef', 413)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 413;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dante Chen', 'dante-chen', 414)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 414;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('To-y', 'to-y', 415)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 415;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Stu Grayson', 'stu-grayson', 416)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 416;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Gravity', 'gravity', 417)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 417;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Thomas Shire', 'thomas-shire', 418)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 418;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Emersyn Jayne', 'emersyn-jayne', 419)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 419;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Brooke Havok', 'brooke-havok', 420)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 420;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Benjamin Tull', 'benjamin-tull', 421)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 421;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mecha Wolf', 'mecha-wolf', 422)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 422;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Crash Jaxon', 'crash-jaxon', 423)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 423;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('KANON', 'kanon', 424)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 424;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('James Shaw', 'james-shaw', 425)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 425;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hell Boy', 'hell-boy', 426)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 426;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Danny Orion', 'danny-orion', 427)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 427;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Pee Wee', 'pee-wee', 428)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 428;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hiroaki Taniguchi', 'hiroaki-taniguchi', 429)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 429;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bear Bronson', 'bear-bronson', 430)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 430;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Landon Riley', 'landon-riley', 431)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 431;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dragon Bane', 'dragon-bane', 432)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 432;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mad Man Pondo', 'mad-man-pondo', 433)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 433;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Elijah Blum', 'elijah-blum', 434)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 434;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hideki Suzuki', 'hideki-suzuki', 435)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 435;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shane Mercer', 'shane-mercer', 436)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 436;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('L. J. Cleary', 'l-j-cleary', 437)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 437;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Drew Parker', 'drew-parker', 438)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 438;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Izzy James', 'izzy-james', 439)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 439;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Eddie Valentine', 'eddie-valentine', 440)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 440;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kota Minoura', 'kota-minoura', 441)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 441;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Anthony Greene', 'anthony-greene', 442)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 442;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Barbaro Cavernario', 'el-barbaro-cavernario', 443)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 443;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Aaron Solo', 'aaron-solo', 444)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 444;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Vinnie Massaro', 'vinnie-massaro', 445)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 445;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Dr. Redacted', 'dr-redacted', 446)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 446;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Caleb Konley', 'caleb-konley', 447)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 447;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('El Hijo del Villano III', 'el-hijo-del-villano-iii', 448)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 448;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Joe Black', 'joe-black', 449)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 449;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kzy', 'kzy', 450)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 450;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Masato Tanaka', 'masato-tanaka', 451)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 451;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Aaron Rourke', 'aaron-rourke', 452)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 452;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Hyan', 'hyan', 453)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 453;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Rickey Shane Page', 'rickey-shane-page', 454)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 454;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Yoshiki Kato', 'yoshiki-kato', 455)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 455;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ricky South', 'ricky-south', 456)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 456;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Beastman', 'beastman', 457)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 457;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Bill Collier', 'bill-collier', 458)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 458;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Vaughn Vertigo', 'vaughn-vertigo', 459)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 459;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Notorious Mimi', 'notorious-mimi', 460)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 460;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Xavier Woods', 'xavier-woods', 461)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 461;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Loue O''Farrell', 'loue-ofarrell', 462)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 462;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Strong Machine J', 'strong-machine-j', 463)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 463;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kaitlyn Marie', 'kaitlyn-marie', 464)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 464;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mikey Montgomery', 'mikey-montgomery', 465)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 465;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kodai Nozaki', 'kodai-nozaki', 466)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 466;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cole Radrick', 'cole-radrick', 467)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 467;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Ho Ho Lun', 'ho-ho-lun', 468)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 468;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Marz the Specialist', 'marz-the-specialist', 469)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 469;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Mike Skyros', 'mike-skyros', 470)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 470;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Joseph Keys', 'joseph-keys', 471)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 471;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jon Davis', 'jon-davis', 472)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 472;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('BK Westbrook', 'bk-westbrook', 473)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 473;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Michael Fynne', 'michael-fynne', 474)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 474;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cheeseburger', 'cheeseburger', 475)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 475;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tony Deppen', 'tony-deppen', 476)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 476;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('CPA', 'cpa', 477)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 477;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Joe Ocasio', 'joe-ocasio', 478)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 478;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Scorpio Sky', 'scorpio-sky', 479)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 479;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('JDC', 'jdc', 480)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 480;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Solomon Tupu', 'solomon-tupu', 481)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 481;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Facade', 'facade', 482)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 482;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Kenny K', 'kenny-k', 483)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 483;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Deklan Grant', 'deklan-grant', 484)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 484;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tommy Vendetta', 'tommy-vendetta', 485)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 485;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Danshoku Dino', 'danshoku-dino', 486)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 486;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tommy Dreamer', 'tommy-dreamer', 487)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 487;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shiho', 'shiho', 488)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 488;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Horus', 'horus', 489)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 489;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Shane Malice', 'shane-malice', 490)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 490;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Tjay Sykes', 'tjay-sykes', 491)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 491;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Crowbar', 'crowbar', 492)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 492;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Satnam Singh', 'satnam-singh', 493)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 493;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('LSG', 'lsg', 494)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 494;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Milo Mirra', 'milo-mirra', 495)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 495;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Chris Nastyy', 'chris-nastyy', 496)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 496;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('RPD', 'rpd', 497)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 497;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Eel O''Neal', 'eel-oneal', 498)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 498;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Jeffrey John', 'jeffrey-john', 499)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 499;

INSERT INTO wrestlers (name, slug, pwi_ranking)
VALUES ('Cereal Man', 'cereal-man', 500)
ON CONFLICT (slug) DO UPDATE SET pwi_ranking = 500;

-- Total wrestlers: 473
-- Position range: 2 - 500

DO $$
DECLARE cnt INTEGER;
BEGIN
    SELECT COUNT(*) INTO cnt FROM wrestlers WHERE pwi_ranking IS NOT NULL;
    RAISE NOTICE 'PWI 500 import complete: % wrestlers ranked', cnt;
END $$;