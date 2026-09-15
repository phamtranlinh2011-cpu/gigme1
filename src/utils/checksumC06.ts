// Thuật toán kiểm tra mã Checksum C06 Bộ Công An & Chuẩn ICAO 9303 Doc 9303 Part 3
// Trọng số nhân xoay vòng: 7, 3, 1, 7, 3, 1... Modulo 10

const ICAO_WEIGHTS = [7, 3, 1];

export function getIcaoCharValue(ch: string): number {
  const code = ch.toUpperCase().charCodeAt(0);
  if (code >= 48 && code <= 57) {
    return code - 48; // '0' -> '9'
  }
  if (code >= 65 && code <= 90) {
    return code - 55; // 'A' (10) -> 'Z' (35)
  }
  return 0; // '<' filler or others
}

export function computeIcaoChecksum(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const val = getIcaoCharValue(input[i]);
    const weight = ICAO_WEIGHTS[i % 3];
    sum += val * weight;
  }
  return sum % 10;
}

export function verifyIcaoCheckDigit(data: string, checkDigitStr: string): boolean {
  const expected = computeIcaoChecksum(data);
  const actual = parseInt(checkDigitStr, 10);
  return expected === actual;
}

// Kiểm tra tính hợp lệ số thẻ CCCD 12 số theo quy định C06 Bộ Công An:
// 3 số đầu: Mã tỉnh/thành phố (001 - 096)
// 1 số thứ 4: Thế kỷ sinh & Giới tính (0: Nam TK 20, 1: Nữ TK 20, 2: Nam TK 21, 3: Nữ TK 21...)
// 2 số thứ 5-6: 2 số cuối năm sinh
// 6 số cuối: Dãy số ngẫu nhiên
export function validateVietnamCccdNumber(cccd: string): {
  isValid: boolean;
  provinceCode?: string;
  provinceName?: string;
  gender?: 'Nam' | 'Nữ';
  birthCenturyYear?: string;
  error?: string;
} {
  const clean = cccd.replace(/\D/g, '');
  if (clean.length !== 12) {
    return { isValid: false, error: 'Số CCCD phải bao gồm đúng 12 chữ số' };
  }

  const provCode = clean.substring(0, 3);
  const genderCenturyCode = parseInt(clean[3], 10);
  const birth2Digits = clean.substring(4, 6);

  const PROVINCE_MAP: Record<string, string> = {
    '001': 'Hà Nội',
    '079': 'TP. Hồ Chí Minh',
    '048': 'Đà Nẵng',
    '031': 'Hải Phòng',
    '092': 'Cần Thơ',
    '075': 'Đồng Nai',
    '074': 'Bình Dương',
    '040': 'Nghệ An',
    '038': 'Thanh Hóa',
    '042': 'Hà Tĩnh',
    '049': 'Quảng Nam',
    '056': 'Khánh Hòa',
    '068': 'Lâm Đồng',
    '080': 'Long An',
    '082': 'Tiền Giang',
    '086': 'Vĩnh Long',
    '089': 'An Giang',
    '096': 'Cà Mau',
  };

  const provinceName = PROVINCE_MAP[provCode] || `Tỉnh/TP Mã ${provCode}`;

  let gender: 'Nam' | 'Nữ' = 'Nam';
  let century = '19';
  if (genderCenturyCode === 0) { gender = 'Nam'; century = '19'; }
  else if (genderCenturyCode === 1) { gender = 'Nữ'; century = '19'; }
  else if (genderCenturyCode === 2) { gender = 'Nam'; century = '20'; }
  else if (genderCenturyCode === 3) { gender = 'Nữ'; century = '20'; }
  else if (genderCenturyCode === 4) { gender = 'Nam'; century = '21'; }
  else if (genderCenturyCode === 5) { gender = 'Nữ'; century = '21'; }

  return {
    isValid: true,
    provinceCode: provCode,
    provinceName,
    gender,
    birthCenturyYear: `${century}${birth2Digits}`,
  };
}

// Sinh ra chuỗi MRZ chuẩn 3 dòng ICAO 9303 TD1 cho thẻ CCCD Việt Nam
export function generateCccdMrz(
  cccdNumber: string,
  birthDateYYMMDD: string,
  genderM_F: 'M' | 'F',
  expiryYYMMDD: string,
  fullNameNoAccent: string
): { line1: string; line2: string; line3: string; overallChecksum: number } {
  const cleanId = (cccdNumber.replace(/\D/g, '') + '<<<<<<<<<<<<').substring(0, 12);
  const idCheck = computeIcaoChecksum(cleanId);
  const line1 = `IDVNM${cleanId}${idCheck}<<<<<<<<<<<<<<<`.substring(0, 30);

  const cleanBirth = (birthDateYYMMDD.replace(/\D/g, '') + '000000').substring(0, 6);
  const birthCheck = computeIcaoChecksum(cleanBirth);

  const cleanExp = (expiryYYMMDD.replace(/\D/g, '') + '351231').substring(0, 6);
  const expCheck = computeIcaoChecksum(cleanExp);

  const rawLine2Composite = `${cleanBirth}${birthCheck}${genderM_F}${cleanExp}${expCheck}VNM<<<<<<<<<<<`;
  const line2Check = computeIcaoChecksum(rawLine2Composite.substring(0, 29));
  const line2 = (rawLine2Composite.substring(0, 29) + line2Check).substring(0, 30);

  // Line 3: Name formatted as LAST<<FIRST<MIDDLE
  const formattedName = fullNameNoAccent
    .toUpperCase()
    .replace(/[^A-Z]/g, '<')
    .replace(/<+/g, '<')
    .padEnd(30, '<')
    .substring(0, 30);

  return {
    line1,
    line2,
    line3: formattedName,
    overallChecksum: line2Check,
  };
}
