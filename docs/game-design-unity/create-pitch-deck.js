const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const {
  FaBookOpen, FaGamepad, FaPalette, FaDesktop, FaRoad,
  FaChartLine, FaDollarSign, FaCross, FaUsers, FaHeart,
  FaShieldAlt, FaBrain, FaFire, FaMap, FaCalendarAlt,
  FaStar, FaMountain, FaEye, FaDoorOpen, FaHome,
  FaArrowRight, FaCheck, FaLayerGroup
} = require("react-icons/fa");

function renderIconSvg(IconComponent, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

const C = {
  navy:       "1E2A3A",
  cream:      "F5E6D3",
  gold:       "D4A853",
  darkBrown:  "3B2F2F",
  milk:       "FAF6F0",
  ochre:      "C8956C",
  deepPurple: "2D1B4E",
  darkRed:    "8B3A3A",
  warmGray:   "A89B8C",
  softGold:   "EAD9B5",
  white:      "FFFFFF",
  lightNavy:  "2A3F55",
  parchment:  "F0E6D2",
};

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.2 });

async function createPitchDeck() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Pilgrim's Progress Dev";
  pres.title = "천로역정 — 순례자의 여정 | Game Pitch Deck";

  const iconCross = await iconToBase64Png(FaCross, `#${C.gold}`, 256);
  const iconBook = await iconToBase64Png(FaBookOpen, `#${C.gold}`, 256);
  const iconHeart = await iconToBase64Png(FaHeart, `#${C.gold}`, 256);
  const iconGamepad = await iconToBase64Png(FaGamepad, `#${C.cream}`, 256);
  const iconPalette = await iconToBase64Png(FaPalette, `#${C.cream}`, 256);
  const iconDesktop = await iconToBase64Png(FaDesktop, `#${C.cream}`, 256);
  const iconRoad = await iconToBase64Png(FaRoad, `#${C.gold}`, 256);
  const iconChart = await iconToBase64Png(FaChartLine, `#${C.cream}`, 256);
  const iconDollar = await iconToBase64Png(FaDollarSign, `#${C.cream}`, 256);
  const iconShield = await iconToBase64Png(FaShieldAlt, `#${C.gold}`, 256);
  const iconBrain = await iconToBase64Png(FaBrain, `#${C.gold}`, 256);
  const iconFire = await iconToBase64Png(FaFire, `#${C.darkRed}`, 256);
  const iconMap = await iconToBase64Png(FaMap, `#${C.ochre}`, 256);
  const iconStar = await iconToBase64Png(FaStar, `#${C.gold}`, 256);
  const iconMountain = await iconToBase64Png(FaMountain, `#${C.warmGray}`, 256);
  const iconEye = await iconToBase64Png(FaEye, `#${C.gold}`, 256);
  const iconDoor = await iconToBase64Png(FaDoorOpen, `#${C.ochre}`, 256);
  const iconHome = await iconToBase64Png(FaHome, `#${C.darkRed}`, 256);
  const iconUsers = await iconToBase64Png(FaUsers, `#${C.ochre}`, 256);
  const iconArrow = await iconToBase64Png(FaArrowRight, `#${C.gold}`, 256);
  const iconCheck = await iconToBase64Png(FaCheck, `#${C.gold}`, 256);
  const iconLayer = await iconToBase64Png(FaLayerGroup, `#${C.cream}`, 256);
  const iconCalendar = await iconToBase64Png(FaCalendarAlt, `#${C.cream}`, 256);

  // =============================================
  // SLIDE 1: TITLE
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { color: C.deepPurple, transparency: 30 }
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 4.8, w: 10, h: 0.825,
      fill: { color: "000000", transparency: 60 }
    });

    slide.addImage({ data: iconCross, x: 4.55, y: 0.8, w: 0.9, h: 0.9 });

    slide.addText("천로역정", {
      x: 0.5, y: 1.8, w: 9, h: 1.2,
      fontSize: 52, fontFace: "Georgia", color: C.gold,
      bold: true, align: "center", valign: "middle",
      charSpacing: 8, margin: 0
    });

    slide.addText("순례자의 여정  |  The Pilgrim's Progress", {
      x: 0.5, y: 2.9, w: 9, h: 0.6,
      fontSize: 18, fontFace: "Georgia", color: C.cream,
      align: "center", valign: "middle", italic: true, margin: 0
    });

    slide.addShape(pres.shapes.LINE, {
      x: 3.5, y: 3.65, w: 3, h: 0,
      line: { color: C.gold, width: 1.5 }
    });

    slide.addText("인터랙티브 내러티브 어드벤처", {
      x: 0.5, y: 3.85, w: 9, h: 0.5,
      fontSize: 16, fontFace: "Calibri", color: C.softGold,
      align: "center", valign: "middle", margin: 0
    });

    slide.addText("Game Pitch Deck  |  2026", {
      x: 0.5, y: 4.9, w: 9, h: 0.5,
      fontSize: 12, fontFace: "Calibri", color: C.warmGray,
      align: "center", valign: "middle", margin: 0
    });
  }

  // =============================================
  // SLIDE 2: VISION — WHY THIS GAME?
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.milk };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.gold }
    });

    slide.addImage({ data: iconHeart, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("왜 이 게임인가?", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("WHY THIS GAME?", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    const visionCards = [
      { icon: iconBook, title: "300년 검증된 서사", desc: "전 세계 2억 부 이상 읽힌\n존 번연의 불멸의 고전" },
      { icon: iconCross, title: "복음의 체험", desc: "가르치는 게임이 아닌\n직접 걸어보는 순례길" },
      { icon: iconUsers, title: "보편적 공감", desc: "크리스천이든 아니든\n\"내 등에도 짐이 있지 않은가?\"" },
      { icon: iconStar, title: "무료 복음", desc: "데모만으로 완결된\n구원의 메시지 전달" },
    ];

    visionCards.forEach((card, i) => {
      const x = 0.5 + i * 2.3;
      const y = 1.5;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.1, h: 2.7,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.1, h: 0.06,
        fill: { color: C.gold }
      });
      slide.addImage({ data: card.icon, x: x + 0.8, y: y + 0.3, w: 0.5, h: 0.5 });
      slide.addText(card.title, {
        x: x + 0.1, y: y + 0.95, w: 1.9, h: 0.45,
        fontSize: 13, fontFace: "Georgia", color: C.darkBrown,
        bold: true, align: "center", valign: "middle", margin: 0
      });
      slide.addText(card.desc, {
        x: x + 0.1, y: y + 1.4, w: 1.9, h: 1.0,
        fontSize: 11, fontFace: "Calibri", color: C.warmGray,
        align: "center", valign: "top", margin: 0
      });
    });

    slide.addText([
      { text: "\"좋은 게임은 플레이어에게 즐거움을 주고, 위대한 게임은 플레이어의 마음을 바꿉니다.\"", options: { italic: true } }
    ], {
      x: 0.5, y: 4.55, w: 9, h: 0.55,
      fontSize: 12, fontFace: "Georgia", color: C.ochre,
      align: "center", valign: "middle", margin: 0
    });
  }

  // =============================================
  // SLIDE 3: THE STORY
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addImage({ data: iconRoad, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("크리스천의 여정", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.gold,
      bold: true, margin: 0
    });
    slide.addText("THE JOURNEY OF CHRISTIAN", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    const journeySteps = [
      { num: "01", label: "멸망의 도시", sub: "City of Destruction", color: C.darkRed },
      { num: "02", label: "절망의 늪", sub: "Slough of Despond", color: C.warmGray },
      { num: "03", label: "좁은 문", sub: "Wicket Gate", color: C.ochre },
      { num: "04", label: "십자가", sub: "The Cross", color: C.gold },
      { num: "05", label: "아름다운 궁전", sub: "Palace Beautiful", color: C.softGold },
      { num: "06", label: "아폴리온 전투", sub: "Fight with Apollyon", color: C.darkRed },
      { num: "07", label: "허영의 시장", sub: "Vanity Fair", color: C.ochre },
      { num: "08", label: "천성", sub: "Celestial City", color: C.gold },
    ];

    journeySteps.forEach((step, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = 0.5 + col * 2.35;
      const y = 1.5 + row * 1.85;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 2.1, h: 1.55,
        fill: { color: C.lightNavy }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 0.06, h: 1.55,
        fill: { color: step.color }
      });

      slide.addText(step.num, {
        x: x + 0.2, y: y + 0.15, w: 0.5, h: 0.4,
        fontSize: 22, fontFace: "Georgia", color: step.color,
        bold: true, margin: 0
      });
      slide.addText(step.label, {
        x: x + 0.2, y: y + 0.6, w: 1.7, h: 0.4,
        fontSize: 14, fontFace: "Georgia", color: C.cream,
        bold: true, margin: 0
      });
      slide.addText(step.sub, {
        x: x + 0.2, y: y + 0.95, w: 1.7, h: 0.35,
        fontSize: 10, fontFace: "Calibri", color: C.warmGray,
        italic: true, margin: 0
      });

      if (i < 7) {
        if (col < 3) {
          slide.addImage({ data: iconArrow, x: x + 2.15, y: y + 0.55, w: 0.18, h: 0.18 });
        }
      }
    });

    slide.addText("총 25개 장소  ·  40+ 캐릭터  ·  Part 1 완결", {
      x: 0.5, y: 5.0, w: 9, h: 0.35,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      align: "center", margin: 0
    });
  }

  // =============================================
  // SLIDE 4: GENRE & CORE LOOP
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.milk };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.ochre }
    });

    slide.addImage({ data: iconGamepad, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("장르 & 핵심 루프", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("GENRE & CORE LOOP", {
      x: 1.0, y: 0.85, w: 4, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.3, w: 4.3, h: 3.8,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.3, w: 4.3, h: 0.06,
      fill: { color: C.ochre }
    });

    slide.addText("인터랙티브 내러티브 어드벤처", {
      x: 0.7, y: 1.55, w: 3.9, h: 0.4,
      fontSize: 15, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });

    const loopItems = [
      { icon: iconEye, label: "탐험", desc: "장소를 둘러보며 숨겨진\n요소와 인물을 발견" },
      { icon: iconBook, label: "대화 & 선택", desc: "Ink 기반 분기 대화\n도덕적 딜레마 선택" },
      { icon: iconShield, label: "성장", desc: "믿음·용기·지혜 스탯이\n선택에 따라 변화" },
      { icon: iconFire, label: "도전", desc: "QTE 전투, 퍼즐, 인내\n서사적 챌린지" },
    ];

    loopItems.forEach((item, i) => {
      const y = 2.1 + i * 0.7;
      slide.addImage({ data: item.icon, x: 0.85, y: y + 0.05, w: 0.3, h: 0.3 });
      slide.addText(item.label, {
        x: 1.3, y, w: 1.0, h: 0.35,
        fontSize: 12, fontFace: "Georgia", color: C.darkBrown,
        bold: true, margin: 0, valign: "middle"
      });
      slide.addText(item.desc, {
        x: 2.3, y, w: 2.3, h: 0.55,
        fontSize: 10, fontFace: "Calibri", color: C.warmGray,
        margin: 0
      });
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: 1.3, w: 4.3, h: 3.8,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.2, y: 1.3, w: 4.3, h: 0.06,
      fill: { color: C.gold }
    });

    slide.addText("게임 루프 사이클", {
      x: 5.4, y: 1.55, w: 3.9, h: 0.4,
      fontSize: 15, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });

    const cycleSteps = [
      "장소 도착 — 배경/분위기 연출",
      "탐험 — 캐릭터·아이템 발견",
      "대화 — 선택지를 통한 스토리 분기",
      "결과 — 스탯 변동, 아이템 획득",
      "이동 — 다음 장소로 전환",
    ];

    cycleSteps.forEach((step, i) => {
      const y = 2.1 + i * 0.6;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 5.5, y, w: 0.35, h: 0.35,
        fill: { color: C.gold }
      });
      slide.addText(String(i + 1), {
        x: 5.5, y, w: 0.35, h: 0.35,
        fontSize: 13, fontFace: "Georgia", color: C.white,
        bold: true, align: "center", valign: "middle", margin: 0
      });
      slide.addText(step, {
        x: 6.0, y, w: 3.2, h: 0.35,
        fontSize: 11, fontFace: "Calibri", color: C.darkBrown,
        valign: "middle", margin: 0
      });
    });

    slide.addText("Ink (inkle) 내러티브 엔진  ·  Unity 6 LTS  ·  C#", {
      x: 0.5, y: 5.15, w: 9, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.warmGray,
      align: "center", margin: 0
    });
  }

  // =============================================
  // SLIDE 5: ART DIRECTION
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addImage({ data: iconPalette, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("아트 디렉션", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.gold,
      bold: true, margin: 0
    });
    slide.addText("ART DIRECTION — STORYBOOK WATERCOLOR", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    slide.addText("스토리북 수채화 (Storybook Watercolor)", {
      x: 0.5, y: 1.35, w: 9, h: 0.4,
      fontSize: 16, fontFace: "Georgia", color: C.cream,
      bold: true, margin: 0
    });
    slide.addText("꿈속의 우화 — 따뜻한 붓 터치와 빛과 어둠의 극적 대비", {
      x: 0.5, y: 1.7, w: 9, h: 0.3,
      fontSize: 12, fontFace: "Calibri", color: C.warmGray,
      italic: true, margin: 0
    });

    slide.addText("빛의 팔레트 — 구원, 교제, 희망", {
      x: 0.5, y: 2.3, w: 4.5, h: 0.35,
      fontSize: 12, fontFace: "Georgia", color: C.cream, bold: true, margin: 0
    });

    const lightColors = [
      { hex: C.ochre, label: "따뜻한 황토\n#C8956C" },
      { hex: C.cream, label: "밀크\n#F5E6D3" },
      { hex: C.gold, label: "금빛\n#D4A853" },
      { hex: C.darkBrown, label: "다크 브라운\n#3B2F2F" },
    ];

    lightColors.forEach((c, i) => {
      const x = 0.5 + i * 1.15;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 2.75, w: 0.95, h: 0.7,
        fill: { color: c.hex }
      });
      slide.addText(c.label, {
        x, y: 3.5, w: 0.95, h: 0.55,
        fontSize: 8, fontFace: "Calibri", color: C.warmGray,
        align: "center", margin: 0
      });
    });

    slide.addText("어둠의 팔레트 — 시련, 절망, 유혹", {
      x: 5.3, y: 2.3, w: 4.5, h: 0.35,
      fontSize: 12, fontFace: "Georgia", color: C.cream, bold: true, margin: 0
    });

    const darkColors = [
      { hex: C.navy, label: "깊은 남색\n#1E2A3A" },
      { hex: C.deepPurple, label: "보라 어둠\n#2D1B4E" },
      { hex: C.darkRed, label: "어두운 적색\n#8B3A3A" },
      { hex: "FF6B35", label: "불꽃 오렌지\n#FF6B35" },
    ];

    darkColors.forEach((c, i) => {
      const x = 5.3 + i * 1.15;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 2.75, w: 0.95, h: 0.7,
        fill: { color: c.hex }
      });
      slide.addText(c.label, {
        x, y: 3.5, w: 0.95, h: 0.55,
        fontSize: 8, fontFace: "Calibri", color: C.warmGray,
        align: "center", margin: 0
      });
    });

    const stylePoints = [
      { label: "배경", desc: "넓은 붓 터치, 부드러운 그라데이션\n동화책 일러스트 느낌" },
      { label: "캐릭터", desc: "반 실사 일러스트\n표정이 풍부한 상반신 초상화" },
      { label: "UI", desc: "양피지/고서적 질감\n클래식하되 깔끔한 타이포" },
    ];

    stylePoints.forEach((sp, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 4.2, w: 2.9, h: 1.0,
        fill: { color: C.lightNavy }
      });
      slide.addText(sp.label, {
        x: x + 0.15, y: 4.3, w: 1.0, h: 0.3,
        fontSize: 12, fontFace: "Georgia", color: C.gold,
        bold: true, margin: 0
      });
      slide.addText(sp.desc, {
        x: x + 0.15, y: 4.6, w: 2.6, h: 0.5,
        fontSize: 10, fontFace: "Calibri", color: C.cream,
        margin: 0
      });
    });
  }

  // =============================================
  // SLIDE 6: DIALOGUE WIREFRAME
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.milk };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.gold }
    });

    slide.addImage({ data: iconDesktop, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("대화 화면 와이어프레임", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("DIALOGUE SCREEN WIREFRAME", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    // Game screen mockup
    const sx = 0.7, sy = 1.35, sw = 8.6, sh = 3.85;

    // Background area
    slide.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: sw, h: sh,
      fill: { color: C.parchment },
      line: { color: C.warmGray, width: 1.5 }
    });

    // Background placeholder
    slide.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: sw, h: 2.4,
      fill: { color: C.softGold, transparency: 30 }
    });
    slide.addText("[배경 일러스트]\n해석자의 집 — 첫 번째 방", {
      x: sx + 1, y: sy + 0.6, w: sw - 2, h: 1.0,
      fontSize: 14, fontFace: "Calibri", color: C.warmGray,
      align: "center", valign: "middle", italic: true, margin: 0
    });

    // HUD - top bar
    slide.addShape(pres.shapes.RECTANGLE, {
      x: sx, y: sy, w: sw, h: 0.35,
      fill: { color: C.darkBrown, transparency: 40 }
    });
    slide.addText("해석자의 집 · 첫 번째 방", {
      x: sx + 0.15, y: sy + 0.02, w: 3, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.cream,
      margin: 0
    });
    slide.addText("믿음 42  ·  용기 38  ·  지혜 45", {
      x: sx + 5.5, y: sy + 0.02, w: 3, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.gold,
      align: "right", margin: 0
    });

    // Character portrait area
    slide.addShape(pres.shapes.RECTANGLE, {
      x: sx + 0.3, y: sy + 2.55, w: 1.2, h: 1.1,
      fill: { color: C.white },
      line: { color: C.gold, width: 1 }
    });
    slide.addText("[캐릭터\n초상화]", {
      x: sx + 0.3, y: sy + 2.65, w: 1.2, h: 0.7,
      fontSize: 10, fontFace: "Calibri", color: C.warmGray,
      align: "center", valign: "middle", italic: true, margin: 0
    });
    slide.addText("해석자", {
      x: sx + 0.3, y: sy + 3.35, w: 1.2, h: 0.25,
      fontSize: 9, fontFace: "Georgia", color: C.darkBrown,
      align: "center", bold: true, margin: 0
    });

    // Dialogue box
    slide.addShape(pres.shapes.RECTANGLE, {
      x: sx + 1.7, y: sy + 2.55, w: 6.6, h: 1.1,
      fill: { color: C.white, transparency: 10 },
      line: { color: C.ochre, width: 1 }
    });
    slide.addText("\"이 그림을 자세히 보시오. 이 사람은 눈을 하늘로 들고,\n손에는 최고의 책을 들고, 입술에는 진리의 법이 씌여 있으며,\n세상은 그의 뒤에 던져져 있소. 그의 일은 죄인들을 설득하는 것이오.\"", {
      x: sx + 1.9, y: sy + 2.6, w: 6.2, h: 0.95,
      fontSize: 11, fontFace: "Georgia", color: C.darkBrown,
      valign: "top", margin: 0
    });

    // Choice buttons
    const choices = [
      "\"이 그림의 인물은 누구입니까?\"  → 지혜 +5",
      "\"왜 세상이 뒤에 던져져 있습니까?\"  → 믿음 +5",
      "\"다음 방으로 가겠습니다.\"",
    ];

    slide.addText("선택지 영역", {
      x: 0.7, y: 5.25, w: 1.5, h: 0.25,
      fontSize: 9, fontFace: "Calibri", color: C.warmGray, italic: true, margin: 0
    });

    choices.forEach((choice, i) => {
      const cx = 0.7 + i * 3.05;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: cx, y: 5.25, w: 2.85, h: 0.28,
        fill: { color: C.ochre, transparency: 80 },
        line: { color: C.ochre, width: 0.5 }
      });
      slide.addText(choice, {
        x: cx + 0.1, y: 5.25, w: 2.65, h: 0.28,
        fontSize: 8, fontFace: "Calibri", color: C.darkBrown,
        valign: "middle", margin: 0
      });
    });
  }

  // =============================================
  // SLIDE 7: MAP & COLLECTION WIREFRAME
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.milk };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.ochre }
    });

    slide.addImage({ data: iconMap, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("여정 지도 & 수집 화면", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("JOURNEY MAP & COLLECTION SCREEN", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    // Map wireframe (left)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.3, w: 5.0, h: 3.8,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.3, w: 5.0, h: 0.06,
      fill: { color: C.ochre }
    });
    slide.addText("여정 지도 (Journey Map)", {
      x: 0.7, y: 1.45, w: 4.6, h: 0.35,
      fontSize: 13, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });

    const mapLocations = [
      { name: "멸망의 도시", x: 0.8, y: 2.1, visited: true },
      { name: "절망의 늪", x: 1.8, y: 2.6, visited: true },
      { name: "좁은 문", x: 2.8, y: 2.3, visited: true },
      { name: "해석자의 집", x: 3.8, y: 2.8, visited: true },
      { name: "십자가", x: 4.5, y: 2.2, visited: false },
    ];

    mapLocations.forEach((loc, i) => {
      const color = loc.visited ? C.gold : C.warmGray;
      slide.addShape(pres.shapes.OVAL, {
        x: loc.x, y: loc.y, w: 0.3, h: 0.3,
        fill: { color }
      });
      slide.addText(loc.name, {
        x: loc.x - 0.3, y: loc.y + 0.32, w: 0.9, h: 0.25,
        fontSize: 7, fontFace: "Calibri", color: C.darkBrown,
        align: "center", margin: 0
      });
      if (i < mapLocations.length - 1) {
        const next = mapLocations[i + 1];
        slide.addShape(pres.shapes.LINE, {
          x: loc.x + 0.3, y: loc.y + 0.15,
          w: next.x - loc.x - 0.3, h: next.y - loc.y,
          line: { color: loc.visited ? C.gold : C.warmGray, width: 1, dashType: loc.visited ? "solid" : "dash" }
        });
      }
    });

    slide.addText("[양피지 질감 배경 위에\n방문한 장소는 금빛, 미방문은 회색\n경로가 점선/실선으로 연결]", {
      x: 1.0, y: 3.8, w: 4.0, h: 0.8,
      fontSize: 9, fontFace: "Calibri", color: C.warmGray,
      italic: true, align: "center", margin: 0
    });

    // Collection wireframe (right)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.8, y: 1.3, w: 3.7, h: 3.8,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 5.8, y: 1.3, w: 3.7, h: 0.06,
      fill: { color: C.gold }
    });
    slide.addText("성경 구절 카드", {
      x: 6.0, y: 1.45, w: 3.3, h: 0.35,
      fontSize: 13, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("수집: 5 / 52", {
      x: 8.0, y: 1.45, w: 1.3, h: 0.35,
      fontSize: 10, fontFace: "Calibri", color: C.warmGray,
      align: "right", margin: 0
    });

    const cards = [
      { verse: "이사야 64:6", text: "우리의 의는 더러운 옷 같으며..." },
      { verse: "마태복음 7:13-14", text: "좁은 문으로 들어가라..." },
      { verse: "요한복음 16:8", text: "그가 와서 세상에 대하여..." },
      { verse: "???", text: "[미발견]" },
      { verse: "???", text: "[미발견]" },
    ];

    cards.forEach((card, i) => {
      const y = 1.95 + i * 0.6;
      const found = card.verse !== "???";
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 6.0, y, w: 3.3, h: 0.5,
        fill: { color: found ? C.parchment : C.warmGray, transparency: found ? 0 : 70 },
        line: { color: found ? C.ochre : C.warmGray, width: 0.5 }
      });
      slide.addText(card.verse, {
        x: 6.1, y, w: 1.2, h: 0.5,
        fontSize: 9, fontFace: "Georgia", color: found ? C.darkBrown : C.warmGray,
        bold: true, valign: "middle", margin: 0
      });
      slide.addText(card.text, {
        x: 7.3, y, w: 1.9, h: 0.5,
        fontSize: 9, fontFace: "Calibri", color: found ? C.darkBrown : C.warmGray,
        italic: !found, valign: "middle", margin: 0
      });
    });
  }

  // =============================================
  // SLIDE 8: MVP SCOPE
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addImage({ data: iconLayer, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("MVP / 무료 데모 범위", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.gold,
      bold: true, margin: 0
    });
    slide.addText("MVP SCOPE — FREE DEMO", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    // Big stat callouts
    const stats = [
      { num: "7", label: "장소\nLocations" },
      { num: "14", label: "캐릭터\nCharacters" },
      { num: "26", label: "선택지\nChoices" },
      { num: "40~60", label: "플레이타임(분)\nPlay Minutes" },
    ];

    stats.forEach((stat, i) => {
      const x = 0.5 + i * 2.35;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.4, w: 2.1, h: 1.2,
        fill: { color: C.lightNavy }
      });
      slide.addText(stat.num, {
        x, y: 1.45, w: 2.1, h: 0.65,
        fontSize: 32, fontFace: "Georgia", color: C.gold,
        bold: true, align: "center", valign: "middle", margin: 0
      });
      slide.addText(stat.label, {
        x, y: 2.1, w: 2.1, h: 0.4,
        fontSize: 10, fontFace: "Calibri", color: C.warmGray,
        align: "center", valign: "middle", margin: 0
      });
    });

    // MVP journey flow
    slide.addText("데모 여정: 멸망의 도시 → 십자가 (핵심 복음 아크)", {
      x: 0.5, y: 2.85, w: 9, h: 0.35,
      fontSize: 13, fontFace: "Georgia", color: C.cream,
      bold: true, margin: 0
    });

    const mvpSteps = [
      { name: "멸망의 도시", desc: "시작: 짐의 자각", color: C.darkRed },
      { name: "들판", desc: "완고·유연과의 만남", color: C.warmGray },
      { name: "절망의 늪", desc: "첫 번째 시련", color: C.warmGray },
      { name: "세상지혜씨", desc: "유혹과 결단", color: C.ochre },
      { name: "좁은 문", desc: "은혜의 입구", color: C.gold },
      { name: "해석자의 집", desc: "7개 방의 교훈", color: C.gold },
      { name: "십자가", desc: "짐이 떨어지다", color: C.gold },
    ];

    mvpSteps.forEach((step, i) => {
      const x = 0.35 + i * 1.36;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 3.35, w: 1.22, h: 1.1,
        fill: { color: C.lightNavy }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 3.35, w: 1.22, h: 0.04,
        fill: { color: step.color }
      });
      slide.addText(step.name, {
        x: x + 0.05, y: 3.5, w: 1.12, h: 0.35,
        fontSize: 9, fontFace: "Georgia", color: C.cream,
        bold: true, align: "center", margin: 0
      });
      slide.addText(step.desc, {
        x: x + 0.05, y: 3.85, w: 1.12, h: 0.4,
        fontSize: 8, fontFace: "Calibri", color: C.warmGray,
        align: "center", margin: 0
      });
    });

    slide.addText([
      { text: "죄의 자각 → 방황 → 유혹 → 결단 → 은혜 → 교훈 → 구원", options: { bold: true, color: C.gold } },
      { text: " — 완결된 복음 메시지", options: { color: C.warmGray } }
    ], {
      x: 0.5, y: 4.7, w: 9, h: 0.3,
      fontSize: 11, fontFace: "Calibri", align: "center", margin: 0
    });

    slide.addText("데모만으로 복음의 핵심(십자가의 은혜)을 온전히 경험 가능", {
      x: 0.5, y: 5.1, w: 9, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.warmGray,
      align: "center", italic: true, margin: 0
    });
  }

  // =============================================
  // SLIDE 9: STATS & SYSTEMS
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.milk };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.gold }
    });

    slide.addImage({ data: iconShield, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("핵심 시스템", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("CORE SYSTEMS — STATS, BURDEN, COLLECTION", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    // Three stat cards
    const statCards = [
      { icon: iconCross, stat: "믿음 (Faith)", desc: "하나님에 대한 신뢰.\n두려운 선택에서\n나아갈 때 증가.", color: C.gold, start: "30" },
      { icon: iconShield, stat: "용기 (Courage)", desc: "시련 앞의 담대함.\n위험을 감수하고\n맞설 때 증가.", color: C.darkRed, start: "25" },
      { icon: iconBrain, stat: "지혜 (Wisdom)", desc: "영적 분별력.\n올바른 판단을\n내릴 때 증가.", color: C.ochre, start: "35" },
    ];

    statCards.forEach((sc, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.35, w: 2.9, h: 2.2,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.35, w: 2.9, h: 0.06,
        fill: { color: sc.color }
      });

      slide.addImage({ data: sc.icon, x: x + 1.15, y: 1.55, w: 0.5, h: 0.5 });
      slide.addText(sc.stat, {
        x: x + 0.1, y: 2.15, w: 2.7, h: 0.35,
        fontSize: 14, fontFace: "Georgia", color: C.darkBrown,
        bold: true, align: "center", margin: 0
      });
      slide.addText(sc.desc, {
        x: x + 0.2, y: 2.5, w: 2.5, h: 0.65,
        fontSize: 10, fontFace: "Calibri", color: C.warmGray,
        align: "center", margin: 0
      });
      slide.addText("시작값: " + sc.start, {
        x: x + 0.1, y: 3.15, w: 2.7, h: 0.25,
        fontSize: 9, fontFace: "Calibri", color: sc.color,
        align: "center", margin: 0
      });
    });

    // Burden mechanic
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 3.8, w: 9, h: 1.5,
      fill: { color: C.white },
      shadow: makeShadow()
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 3.8, w: 9, h: 0.06,
      fill: { color: C.darkRed }
    });

    slide.addImage({ data: iconMountain, x: 0.7, y: 4.05, w: 0.4, h: 0.4 });
    slide.addText("짐 (Burden) 시스템", {
      x: 1.2, y: 4.05, w: 3, h: 0.4,
      fontSize: 14, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });

    slide.addText([
      { text: "크리스천은 등에 무거운 짐을 지고 있습니다.\n", options: { breakLine: true } },
      { text: "이 짐은 선택에 따라 무거워지거나 가벼워지며, 이동 속도와 선택지에 영향을 줍니다.\n", options: { breakLine: true } },
      { text: "십자가에 도달하면 짐이 떨어지며 — 게임의 가장 강렬한 카타르시스입니다.", options: { bold: true } }
    ], {
      x: 1.2, y: 4.45, w: 8.0, h: 0.75,
      fontSize: 11, fontFace: "Calibri", color: C.darkBrown,
      margin: 0
    });
  }

  // =============================================
  // SLIDE 10: KEY MOMENTS
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addImage({ data: iconStar, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("핵심 드라마틱 순간들", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.gold,
      bold: true, margin: 0
    });
    slide.addText("KEY DRAMATIC MOMENTS", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    const moments = [
      {
        title: "짐이 떨어지는 순간",
        sub: "The Burden Falls at the Cross",
        desc: "십자가 앞에서 크리스천의 등에서 짐이 굴러 떨어집니다.\n빛나는 자 세 명이 나타나 새 옷을 입혀주고, 이마에 표를 찍으며,\n두루마리를 건네줍니다. 이 순간이 게임의 감정적 절정입니다.",
        color: C.gold
      },
      {
        title: "아폴리온과의 전투",
        sub: "Battle with Apollyon",
        desc: "드래곤 같은 마왕 아폴리온이 길을 가로막습니다.\nQTE 기반 전투 — '만군의 검'으로 최후의 일격.\n전 세계 갑옷을 입되, 등에는 갑옷이 없으므로 후퇴는 불가.",
        color: C.darkRed
      },
      {
        title: "신실의 순교",
        sub: "Faithful's Martyrdom at Vanity Fair",
        desc: "가장 친한 동행자 신실이 허영의 시장에서 화형당합니다.\n플레이어가 무력하게 지켜보는 순간 — 하늘의 병거가 내려옵니다.\n슬픔 속에서도 희망을 발견하는 역설적 장면.",
        color: C.ochre
      },
    ];

    moments.forEach((m, i) => {
      const y = 1.35 + i * 1.35;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y, w: 9, h: 1.15,
        fill: { color: C.lightNavy }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.5, y, w: 0.06, h: 1.15,
        fill: { color: m.color }
      });

      slide.addText(m.title, {
        x: 0.75, y: y + 0.1, w: 3.5, h: 0.3,
        fontSize: 14, fontFace: "Georgia", color: m.color,
        bold: true, margin: 0
      });
      slide.addText(m.sub, {
        x: 0.75, y: y + 0.4, w: 3.5, h: 0.25,
        fontSize: 10, fontFace: "Calibri", color: C.warmGray,
        italic: true, margin: 0
      });
      slide.addText(m.desc, {
        x: 4.3, y: y + 0.1, w: 5.0, h: 0.95,
        fontSize: 10, fontFace: "Calibri", color: C.cream,
        valign: "top", margin: 0
      });
    });

    slide.addText("+ 사망의 골짜기, 의심의 성 탈출, 사망의 강 건너기 등 15+ 드라마틱 장면", {
      x: 0.5, y: 5.1, w: 9, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: C.warmGray,
      align: "center", italic: true, margin: 0
    });
  }

  // =============================================
  // SLIDE 11: DEVELOPMENT TIMELINE
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.milk };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.12, h: 5.625,
      fill: { color: C.ochre }
    });

    slide.addImage({ data: iconCalendar, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("개발 타임라인", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.darkBrown,
      bold: true, margin: 0
    });
    slide.addText("DEVELOPMENT TIMELINE — ~12 MONTHS", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    const phases = [
      { name: "Phase 0\n기획/설계", weeks: "W01-06", duration: "6주", color: C.warmGray, w: 1.15 },
      { name: "Phase 1\n버티컬 슬라이스", weeks: "W07-12", duration: "6주", color: C.ochre, w: 1.15 },
      { name: "Phase 2\nMVP/데모 개발", weeks: "W13-24", duration: "12주", color: C.gold, w: 2.3 },
      { name: "Phase 3\n데모 출시", weeks: "W25-28", duration: "4주", color: C.darkRed, w: 0.75 },
      { name: "Phase 4\n정식판 개발", weeks: "W29-48", duration: "20주", color: C.navy, w: 2.3 },
      { name: "Phase 5\n런칭", weeks: "W49-52", duration: "4주", color: C.gold, w: 0.75 },
    ];

    let px = 0.5;
    phases.forEach((phase) => {
      const y = 1.4;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: px, y, w: phase.w, h: 0.7,
        fill: { color: phase.color }
      });
      slide.addText(phase.name, {
        x: px, y, w: phase.w, h: 0.7,
        fontSize: phase.w < 1 ? 7 : 9, fontFace: "Calibri", color: C.white,
        bold: true, align: "center", valign: "middle", margin: 0
      });
      slide.addText(phase.duration, {
        x: px, y: y + 0.75, w: phase.w, h: 0.25,
        fontSize: 8, fontFace: "Calibri", color: C.warmGray,
        align: "center", margin: 0
      });
      px += phase.w + 0.08;
    });

    // Phase details
    const details = [
      { phase: "Phase 0", items: "컨셉 확정 · GDD 완성 · 아트 스타일 가이드\nInk 프로토타입 · Unity 프로젝트 셋업" },
      { phase: "Phase 1", items: "1개 장소 완성 (해석자의 집 7개 방)\n전 시스템 검증: 대화, 선택, 스탯, 전환, 세이브" },
      { phase: "Phase 2", items: "7개 장소 전체 구현 · UI/UX 완성\n배경 16장, 캐릭터 33표정 · BGM 20트랙" },
      { phase: "Phase 3", items: "플레이테스트 (교회 청년부) · 버그 픽스\nitch.io 데모 출시 · Steam 위시리스트" },
      { phase: "Phase 4", items: "나머지 18+ 장소 · 모바일 포팅\n영어 현지화 · 추가 아트/오디오" },
      { phase: "Phase 5", items: "최종 QA · 스토어 제출\nSteam/Google Play/App Store 동시 출시" },
    ];

    details.forEach((d, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 0.5 + col * 4.7;
      const y = 2.65 + row * 0.95;

      slide.addShape(pres.shapes.RECTANGLE, {
        x, y, w: 4.5, h: 0.8,
        fill: { color: C.white },
        shadow: makeShadow()
      });
      slide.addText(d.phase, {
        x: x + 0.1, y: y + 0.05, w: 1.0, h: 0.25,
        fontSize: 10, fontFace: "Georgia", color: C.darkBrown,
        bold: true, margin: 0
      });
      slide.addText(d.items, {
        x: x + 0.1, y: y + 0.3, w: 4.3, h: 0.45,
        fontSize: 9, fontFace: "Calibri", color: C.warmGray,
        margin: 0
      });
    });

    slide.addText("예상 총 비용: ₩50만~₩130만 ($380~$1,000)  |  예상 개발 기간: ~52주", {
      x: 0.5, y: 5.2, w: 9, h: 0.25,
      fontSize: 10, fontFace: "Calibri", color: C.ochre,
      align: "center", bold: true, margin: 0
    });
  }

  // =============================================
  // SLIDE 12: BUSINESS MODEL
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addImage({ data: iconDollar, x: 0.5, y: 0.4, w: 0.4, h: 0.4 });
    slide.addText("비즈니스 모델 & 플랫폼", {
      x: 1.0, y: 0.35, w: 8, h: 0.55,
      fontSize: 28, fontFace: "Georgia", color: C.gold,
      bold: true, margin: 0
    });
    slide.addText("BUSINESS MODEL & PLATFORMS", {
      x: 1.0, y: 0.85, w: 8, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      margin: 0
    });

    // Pricing table
    const pricing = [
      { tier: "무료 데모", price: "$0", content: "Chapter 01~02\n멸망의 도시 → 십자가\n40~60분", accent: C.warmGray },
      { tier: "정식 버전", price: "$4.99", content: "Part 1 전체\n25개 장소 · 5~8시간\n한영 지원", accent: C.gold },
      { tier: "DLC (추후)", price: "$2.99", content: "Part 2\n크리스티아나의 여정", accent: C.ochre },
    ];

    pricing.forEach((p, i) => {
      const x = 0.5 + i * 3.15;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.4, w: 2.9, h: 2.2,
        fill: { color: C.lightNavy }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 1.4, w: 2.9, h: 0.06,
        fill: { color: p.accent }
      });

      slide.addText(p.tier, {
        x: x + 0.1, y: 1.55, w: 2.7, h: 0.35,
        fontSize: 13, fontFace: "Georgia", color: C.cream,
        bold: true, align: "center", margin: 0
      });
      slide.addText(p.price, {
        x: x + 0.1, y: 1.9, w: 2.7, h: 0.6,
        fontSize: 36, fontFace: "Georgia", color: p.accent,
        bold: true, align: "center", valign: "middle", margin: 0
      });
      slide.addText(p.content, {
        x: x + 0.1, y: 2.55, w: 2.7, h: 0.85,
        fontSize: 11, fontFace: "Calibri", color: C.warmGray,
        align: "center", margin: 0
      });
    });

    // Platform launch order
    slide.addText("플랫폼 출시 순서", {
      x: 0.5, y: 3.9, w: 9, h: 0.35,
      fontSize: 14, fontFace: "Georgia", color: C.cream,
      bold: true, margin: 0
    });

    const platforms = [
      { name: "itch.io", phase: "데모 먼저", when: "Phase 3", fee: "무료" },
      { name: "Steam", phase: "정식 출시", when: "Phase 5", fee: "$100 일회성" },
      { name: "Google Play", phase: "모바일", when: "Phase 5", fee: "$25 일회성" },
      { name: "App Store", phase: "iOS", when: "Phase 5+", fee: "$99/년" },
    ];

    platforms.forEach((plat, i) => {
      const x = 0.5 + i * 2.35;
      slide.addShape(pres.shapes.RECTANGLE, {
        x, y: 4.35, w: 2.1, h: 0.9,
        fill: { color: C.lightNavy }
      });
      slide.addText(plat.name, {
        x: x + 0.1, y: 4.4, w: 1.9, h: 0.25,
        fontSize: 12, fontFace: "Georgia", color: C.gold,
        bold: true, margin: 0
      });
      slide.addText(plat.phase + " · " + plat.when + "\n수수료: " + plat.fee, {
        x: x + 0.1, y: 4.65, w: 1.9, h: 0.5,
        fontSize: 9, fontFace: "Calibri", color: C.warmGray,
        margin: 0
      });
    });
  }

  // =============================================
  // SLIDE 13: CLOSING
  // =============================================
  {
    const slide = pres.addSlide();
    slide.background = { color: C.navy };

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { color: C.deepPurple, transparency: 30 }
    });

    slide.addImage({ data: iconCross, x: 4.55, y: 0.8, w: 0.9, h: 0.9 });

    slide.addText("\"나도 등에 짐을 지고 있었구나\"", {
      x: 0.5, y: 1.9, w: 9, h: 0.8,
      fontSize: 28, fontFace: "Georgia", color: C.gold,
      bold: true, align: "center", valign: "middle", italic: true, margin: 0
    });

    slide.addShape(pres.shapes.LINE, {
      x: 3.5, y: 2.85, w: 3, h: 0,
      line: { color: C.gold, width: 1.5 }
    });

    slide.addText([
      { text: "크리스천이든 아니든,\n", options: { breakLine: true, fontSize: 14 } },
      { text: "이 게임을 끝낸 사람이\n", options: { breakLine: true, fontSize: 14 } },
      { text: "그 짐을 내려놓을 곳이 있다는 것을\n", options: { breakLine: true, fontSize: 14, bold: true } },
      { text: "알게 되기를 바랍니다.", options: { fontSize: 14 } }
    ], {
      x: 1, y: 3.1, w: 8, h: 1.4,
      fontFace: "Georgia", color: C.cream,
      align: "center", valign: "middle", margin: 0
    });

    slide.addText("천로역정 — 순례자의 여정", {
      x: 0.5, y: 4.8, w: 9, h: 0.4,
      fontSize: 16, fontFace: "Georgia", color: C.gold,
      bold: true, align: "center", margin: 0
    });
    slide.addText("The Pilgrim's Progress  ·  Interactive Narrative Adventure  ·  2026", {
      x: 0.5, y: 5.15, w: 9, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.warmGray,
      align: "center", margin: 0
    });
  }

  const outputPath = "/Users/peterjeon/Desktop/workspace/pilgrims-progress/docs/game-design/pilgrims-progress-pitch-deck.pptx";
  await pres.writeFile({ fileName: outputPath });
  console.log("Pitch deck created: " + outputPath);
}

createPitchDeck().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
