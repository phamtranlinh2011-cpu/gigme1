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

export const VIETNAM_PROVINCES: Record<string, string> = {
  '001': 'Hà Nội',
  '002': 'Hà Giang',
  '004': 'Cao Bằng',
  '006': 'Bắc Kạn',
  '008': 'Tuyên Quang',
  '010': 'Lào Cai',
  '011': 'Điện Biên',
  '012': 'Lai Châu',
  '014': 'Sơn La',
  '015': 'Yên Bái',
  '017': 'Hoà Bình',
  '019': 'Thái Nguyên',
  '020': 'Lạng Sơn',
  '022': 'Quảng Ninh',
  '024': 'Bắc Giang',
  '025': 'Phú Thọ',
  '026': 'Vĩnh Phúc',
  '027': 'Bắc Ninh',
  '030': 'Hải Dương',
  '031': 'Hải Phòng',
  '033': 'Hưng Yên',
  '034': 'Thái Bình',
  '035': 'Hà Nam',
  '036': 'Nam Định',
  '037': 'Ninh Bình',
  '038': 'Thanh Hóa',
  '040': 'Nghệ An',
  '042': 'Hà Tĩnh',
  '044': 'Quảng Bình',
  '045': 'Quảng Trị',
  '046': 'Thừa Thiên Huế',
  '048': 'Đà Nẵng',
  '049': 'Quảng Nam',
  '051': 'Quảng Ngãi',
  '052': 'Bình Định',
  '054': 'Phú Yên',
  '056': 'Khánh Hòa',
  '058': 'Ninh Thuận',
  '060': 'Bình Thuận',
  '062': 'Kon Tum',
  '064': 'Gia Lai',
  '066': 'Đắk Lắk',
  '067': 'Đắk Nông',
  '068': 'Lâm Đồng',
  '070': 'Bình Phước',
  '072': 'Tây Ninh',
  '074': 'Bình Dương',
  '075': 'Đồng Nai',
  '077': 'Bà Rịa - Vũng Tàu',
  '079': 'TP. Hồ Chí Minh',
  '080': 'Long An',
  '082': 'Tiền Giang',
  '083': 'Bến Tre',
  '084': 'Trà Vinh',
  '086': 'Vĩnh Long',
  '087': 'Đồng Tháp',
  '089': 'An Giang',
  '091': 'Kiên Giang',
  '092': 'Cần Thơ',
  '093': 'Hậu Giang',
  '094': 'Sóc Trăng',
  '095': 'Bạc Liêu',
  '096': 'Cà Mau',
};

// Kiểm tra tính hợp lệ số thẻ CCCD 12 số theo quy định C06 Bộ Công An:
// 3 số đầu: Mã tỉnh/thành phố khai sinh (001 - 096)
// 1 số thứ 4: Thế kỷ sinh & Giới tính:
//   TK 20 (1900-1999): Nam 0, Nữ 1
//   TK 21 (2000-2099): Nam 2, Nữ 3
//   TK 22 (2100-2199): Nam 4, Nữ 5
//   TK 23 (2200-2299): Nam 6, Nữ 7
//   TK 24 (2300-2399): Nam 8, Nữ 9
// 2 số thứ 5-6: 2 số cuối năm sinh
// 6 số cuối: Dãy số ngẫu nhiên cá nhân (000001 - 999999)
export function validateVietnamCccdNumber(
  cccd: string,
  options?: {
    expectedBirthDate?: string; // DD/MM/YYYY hoặc YYYY
    expectedGender?: string; // 'Nam' | 'Nữ'
  }
): {
  isValid: boolean;
  provinceCode?: string;
  provinceName?: string;
  gender?: 'Nam' | 'Nữ';
  birthCenturyYear?: string;
  randomCode?: string;
  error?: string;
} {
  const clean = (cccd || '').replace(/\D/g, '');
  if (clean.length !== 12) {
    return { isValid: false, error: 'Số CCCD phải bao gồm đúng 12 chữ số' };
  }

  const provCode = clean.substring(0, 3);
  const genderCenturyCode = parseInt(clean[3], 10);
  const birth2Digits = clean.substring(4, 6);
  const randomSuffix = clean.substring(6, 12);

  // 1. Kiểm tra mã tỉnh theo danh mục 63 tỉnh thành Việt Nam
  const provinceName = VIETNAM_PROVINCES[provCode];
  if (!provinceName) {
    return {
      isValid: false,
      error: `Mã tỉnh/thành [${provCode}] không tồn tại trong danh mục 63 tỉnh thành Việt Nam`,
    };
  }

  // 2. Kiểm tra mã giới tính & thế kỷ (0 - 9)
  if (isNaN(genderCenturyCode) || genderCenturyCode < 0 || genderCenturyCode > 9) {
    return {
      isValid: false,
      error: 'Chữ số thứ 4 của CCCD không hợp lệ (mã thế kỷ & giới tính)',
    };
  }

  // 3. Kiểm tra 6 số cuối không thể toàn số 0
  if (randomSuffix === '000000') {
    return {
      isValid: false,
      error: '6 số cuối của CCCD không thể là 000000',
    };
  }

  let gender: 'Nam' | 'Nữ' = 'Nam';
  let century = '19';
  if (genderCenturyCode === 0) { gender = 'Nam'; century = '19'; }
  else if (genderCenturyCode === 1) { gender = 'Nữ'; century = '19'; }
  else if (genderCenturyCode === 2) { gender = 'Nam'; century = '20'; }
  else if (genderCenturyCode === 3) { gender = 'Nữ'; century = '20'; }
  else if (genderCenturyCode === 4) { gender = 'Nam'; century = '21'; }
  else if (genderCenturyCode === 5) { gender = 'Nữ'; century = '21'; }
  else if (genderCenturyCode === 6) { gender = 'Nam'; century = '22'; }
  else if (genderCenturyCode === 7) { gender = 'Nữ'; century = '22'; }
  else if (genderCenturyCode === 8) { gender = 'Nam'; century = '23'; }
  else if (genderCenturyCode === 9) { gender = 'Nữ'; century = '23'; }

  const fullBirthYear = `${century}${birth2Digits}`;

  // 4. Đối chiếu chéo (Cross-check) với thông tin Ngày sinh nếu người dùng đã nhập
  if (options?.expectedBirthDate) {
    const rawBirth = options.expectedBirthDate.trim();
    // Trích xuất năm: nếu dạng DD/MM/YYYY thì lấy 4 số cuối
    const yearMatch = rawBirth.match(/(\d{4})$/);
    if (yearMatch) {
      const expYear = yearMatch[1];
      if (expYear !== fullBirthYear) {
        return {
          isValid: false,
          provinceCode: provCode,
          provinceName,
          gender,
          birthCenturyYear: fullBirthYear,
          randomCode: randomSuffix,
          error: `CCCD ghi năm sinh ${fullBirthYear}, không khớp với năm sinh bạn đã chọn (${expYear})`,
        };
      }
    }
  }

  // 5. Đối chiếu chéo (Cross-check) với Giới tính nếu người dùng đã chọn
  if (options?.expectedGender && (options.expectedGender === 'Nam' || options.expectedGender === 'Nữ')) {
    if (gender !== options.expectedGender) {
      return {
        isValid: false,
        provinceCode: provCode,
        provinceName,
        gender,
        birthCenturyYear: fullBirthYear,
        randomCode: randomSuffix,
        error: `CCCD định danh giới tính ${gender}, không khớp với giới tính bạn đã chọn (${options.expectedGender})`,
      };
    }
  }

  return {
    isValid: true,
    provinceCode: provCode,
    provinceName,
    gender,
    birthCenturyYear: fullBirthYear,
    randomCode: randomSuffix,
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
