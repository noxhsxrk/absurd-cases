// Per-character look. Original designs only.
export type Look = { id: string; name: string; role: string; skin: string; hair: string; shirt: string; pants: string; hairStyle: 'short' | 'long' | 'bun' | 'bald' | 'cap'; h: number; build: number; shoe?: string; acc?: 'glasses' | 'headphones' | 'lanyard' | 'vest' | 'none' };
export const CAST: Record<string, Look> = {
  mali: { id: 'mali', name: 'มะลิ', role: 'พนักงานต้อนรับ', skin: '#E0AC84', hair: '#2A1C1A', shirt: '#C8493F', pants: '#2B2F45', hairStyle: 'bun', h: 1.0, build: 0.95, acc: 'lanyard' },
  ton: { id: 'ton', name: 'ต้น', role: 'พนักงานส่งของ', skin: '#B97F5A', hair: '#1A1614', shirt: '#E2A02B', pants: '#3A3F4A', hairStyle: 'cap', h: 1.02, build: 1.05, acc: 'vest' },
  pim: { id: 'pim', name: 'พิม', role: 'ผู้จัดการ', skin: '#D6A37C', hair: '#17141A', shirt: '#2F3E63', pants: '#1E2233', hairStyle: 'long', h: 1.04, build: 1.0, acc: 'glasses' },
  beam: { id: 'beam', name: 'บีม', role: 'เด็กฝึกงาน', skin: '#E3B48E', hair: '#2B211C', shirt: '#7FA6C9', pants: '#4A4F5C', hairStyle: 'short', h: 0.97, build: 0.9, acc: 'none' },
  nok: { id: 'nok', name: 'นก', role: 'ฝ่ายการตลาด', skin: '#CF9A74', hair: '#3A2A22', shirt: '#7BB38A', pants: '#33384A', hairStyle: 'long', h: 0.98, build: 0.92, acc: 'none' },
  arm: { id: 'arm', name: 'อาร์ม', role: 'โปรแกรมเมอร์', skin: '#D9A987', hair: '#222026', shirt: '#8A6FB4', pants: '#2B2E3B', hairStyle: 'short', h: 1.06, build: 1.0, acc: 'glasses' },
  jay: { id: 'jay', name: 'เจ', role: 'ฝ่ายขาย', skin: '#C58E67', hair: '#1B1715', shirt: '#E9E4D8', pants: '#232A3E', hairStyle: 'short', h: 1.05, build: 1.08, acc: 'none' },
  fon: { id: 'fon', name: 'ฝน', role: 'นักบัญชี', skin: '#E2B08A', hair: '#2A211E', shirt: '#D98FA6', pants: '#3B3F52', hairStyle: 'bun', h: 0.96, build: 0.9, acc: 'glasses' },
  gun: { id: 'gun', name: 'กัน', role: 'นักออกแบบ', skin: '#D3A27C', hair: '#6B3B2A', shirt: '#4FA3A5', pants: '#2A2D38', hairStyle: 'long', h: 1.0, build: 0.95, acc: 'none' },
  mook: { id: 'mook', name: 'มุก', role: 'นักออกแบบ', skin: '#BC8760', hair: '#191517', shirt: '#E6C65A', pants: '#2F3342', hairStyle: 'short', h: 0.97, build: 0.95, acc: 'none' },
  oat: { id: 'oat', name: 'โอ๊ต', role: 'นักวิเคราะห์', skin: '#E5B791', hair: '#1D1A1F', shirt: '#B8533C', pants: '#3A3C46', hairStyle: 'short', h: 1.07, build: 1.05, acc: 'headphones' },
  lek: { id: 'lek', name: 'ลุงเล็ก', role: 'แม่บ้าน', skin: '#A8734F', hair: '#8E8E92', shirt: '#4B7F9E', pants: '#3D4350', hairStyle: 'cap', h: 0.98, build: 1.04, acc: 'vest' },
  dao: { id: 'dao', name: 'ดาว', role: 'มาสาย', skin: '#DDAA84', hair: '#2C1D19', shirt: '#EDE7DA', pants: '#3D2F45', hairStyle: 'long', h: 0.99, build: 0.93, acc: 'none' },
};
