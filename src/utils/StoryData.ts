// ─── ECHO DUNGEON ─ Cốt truyện / Narrative Data ───────────────────────────

export interface LevelStory {
  title: string;
  subtitle: string;
  lore: string;
  bossName: string;
  bossIntro: string;
  bossDefeat: string;
}

/**
 * Lines shown in the MenuScene's "Nhật ký Kai" panel with typewriter effect.
 */
export const STORY_INTRO_LINES: string[] = [
  'Năm 20XX.',
  'Thành phố VĨNH ÂM biến mất khỏi mọi bản đồ.',
  '',
  'KAI — nhà nghiên cứu âm học —',
  'rơi xuống một hầm sâu trong chuyến thám hiểm cuối.',
  '',
  'Tối tăm hoàn toàn.',
  'Không lối ra. Không ánh sáng.',
  '',
  'Nhưng mỗi tiếng vang... soi sáng một khoảnh khắc.',
  'Kai học cách nhìn bằng âm thanh.',
  '',
  '⚠  Trong bóng tối — có thứ đang lắng nghe.',
];

/**
 * Per-level narrative data.  Levels beyond the array reuse the last fallback.
 */
export const LEVEL_STORIES: LevelStory[] = [
  {
    // Level 1
    title: 'TẦNG 1',
    subtitle: 'LỐI VÀO BÓNG TỐI',
    lore: 'Mê cung chào đón Kai bằng sự im lặng...\nvà những bóng ma đầu tiên thức dậy.',
    bossName: 'KẺ GÁC CỬA',
    bossIntro: 'Tiếng bước chân của Kai đánh thức nó.\nKẺ GÁC CỬA đã trấn giữ lối thoát hàng thế kỷ.',
    bossDefeat: 'Lối ra sáng lên trong làn sóng âm.\nKai tiến về phía tầng sâu hơn...',
  },
  {
    // Level 2
    title: 'TẦNG 2',
    subtitle: 'MÊ CUNG MÁU',
    lore: 'Chúng đã nghe thấy Kai từ tầng trên.\nĐây là nơi những kẻ không thoát được mắc kẹt lại.',
    bossName: 'ĐẠI QUẢN NGỤC',
    bossIntro: 'Một tiếng rít xuyên qua bóng tối.\nĐẠI QUẢN NGỤC — kẻ thu nhốt linh hồn — xuất hiện.',
    bossDefeat: 'Mê cung rung chuyển khi hắn ngã xuống.\nNhưng phía dưới... còn điều tệ hơn đang chờ.',
  },
  {
    // Level 3
    title: 'TẦNG 3',
    subtitle: 'NGAI VÀNG ĐỊA NGỤC',
    lore: '"Ngươi đã đi quá xa rồi, Kai..."\nĐây là trung tâm mê cung. Trái tim bóng tối.',
    bossName: 'VƯƠNG KHÍ',
    bossIntro: '"Ta đã ở đây... trước khi ngươi được sinh ra."\nVƯƠNG KHÍ — linh hồn vua cổ đại — thức tỉnh sau 500 năm.',
    bossDefeat: 'Lời nguyền bắt đầu tan vỡ.\nÁnh sáng rò rỉ từ những vết nứt trên trần...',
  },
  {
    // Level 4
    title: 'TẦNG 4',
    subtitle: 'VỰC THẲM',
    lore: 'Mê cung sâu hơn Kai tưởng tượng.\nÁnh sáng tiếng vọng là thứ duy nhất còn lại.',
    bossName: 'LINH HỒN CỔ ĐẠI',
    bossIntro: 'Không tên. Không hình dạng.\nChỉ là sự tồn tại thuần khiết của bóng tối.',
    bossDefeat: 'Nó tan vào hư vô.\nKai nghe tiếng gió từ phía trên — lần đầu tiên.',
  },
];

export function getLevelStory(level: number): LevelStory {
  if (level >= 1 && level <= LEVEL_STORIES.length) {
    return LEVEL_STORIES[level - 1];
  }
  return {
    title: `TẦNG ${level}`,
    subtitle: 'ĐỊA NGỤC VÔ TẬN',
    lore: `Tầng thứ ${level}. Mê cung không có điểm kết thúc.\nKai vẫn tiếp tục — vì không còn lựa chọn nào khác.`,
    bossName: 'BÓNG TỐI THUẦN KHIẾT',
    bossIntro: `Thực thể tầng ${level}. Mạnh hơn mọi thứ đã qua.`,
    bossDefeat: 'Thêm một kẻ thù tiêu diệt. Hành trình vẫn tiếp tục.',
  };
}

/**
 * End-screen text displayed when the player wins (escaped the dungeon).
 */
export const WIN_ENDING_LINES: string[] = [
  'Kai đã phá vỡ lời nguyền cổ đại của Mê Cung Vĩnh Âm.',
  '',
  'Trần mê cung nứt vỡ. Ánh sáng đổ xuống.',
  'Những linh hồn bị giam cầm hàng thế kỷ được giải phóng.',
  '',
  'Kai leo lên — từng bậc một —',
  'cho đến khi cảm nhận được hơi thở của gió đêm.',
  '',
  'Lần đầu tiên nghe tiếng gió, không phải tiếng kẻ thù.',
];

/**
 * Random flavour quotes for the Game Over (defeat) screen.
 */
export const LOSE_QUOTES: string[] = [
  '"Tiếng vọng cuối cùng của Kai tắt dần trong bóng tối."',
  '"Mê cung đã nuốt chửng thêm một linh hồn."',
  '"Bóng tối thắng lần này. Nhưng ký ức của Kai còn mãi."',
  '"Tiếng vọng vang lên... rồi im bặt."',
  '"Vĩnh Âm vẫn còn đó. Vẫn đang chờ người giải phóng."',
];
