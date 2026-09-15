import React, { useState } from 'react';
import {
  Sparkles,
  X,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight,
  BookOpen,
  Code,
  Languages,
  Palette,
  Calculator,
  UploadCloud,
  Check,
  RotateCcw,
} from 'lucide-react';

interface TaskSamplePreset {
  id: string;
  name: string;
  icon: any;
  category: string;
  sampleInput: string;
  result: {
    title: string;
    category: string;
    difficulty: string;
    difficultyScore: number; // 1 - 10
    estimatedMinutes: number;
    recommendedPrice: number;
    floorPrice: number;
    rushPrice: number;
    description: string;
    acceptanceChecklist: string[];
    aiAnalysisNotes: string;
  };
}

const PRESET_SAMPLES: TaskSamplePreset[] = [
  {
    id: 'math',
    name: 'Toán Cao Cấp & Xác Suất',
    icon: Calculator,
    category: 'Tư vấn & Học tập',
    sampleInput: 'Cho biến ngẫu nhiên hai chiều (X, Y) có hàm mật độ đồng thời f(x,y) = k(2x + 3y) trên miền 0 < x < 1, 0 < y < 2. Hãy tìm hằng số k, tìm ma trận hiệp phương sai cov(X,Y) và xét tính độc lập.',
    result: {
      title: 'Giải chi tiết 3 câu Biến ngẫu nhiên hai chiều & Covariance',
      category: 'Tư vấn & Học tập',
      difficulty: 'Trung bình - Khá (Đại học)',
      difficultyScore: 6.8,
      estimatedMinutes: 45,
      recommendedPrice: 90000,
      floorPrice: 70000,
      rushPrice: 130000,
      description: 'Yêu cầu bạn sinh viên ngành Kỹ thuật hoặc Toán có kiến thức vững giải bài bản từng bước, vẽ đồ thị miền xác định và giải thích công thức rõ ràng, chụp ảnh rõ nét.',
      acceptanceChecklist: [
        'Đáp án hằng số k chính xác kèm tích phân từng bước',
        'Tính đúng kỳ vọng E(X), E(Y), Cov(X,Y)',
        'Kết luận tính độc lập có đối chiếu công thức fX(x)*fY(y)',
        'Chữ viết sạch đẹp hoặc gõ công thức LaTeX rõ nét',
      ],
      aiAnalysisNotes: 'Độ phức tạp thuộc phân môn Xác suất Thống kê năm 2. Thời gian giải chuẩn khoảng 30-45 phút. Mức giá 90.000đ sẽ thu hút sinh viên năm 3-4 nhận kèo ngay trong 10 phút.',
    },
  },
  {
    id: 'coding',
    name: 'Đồ Án Lập Trình & Sửa Bug',
    icon: Code,
    category: 'Lập trình & Đồ án',
    sampleInput: 'Cần sửa lỗi CORS và fix token JWT hết hạn tự động refresh bằng Axios Interceptor trong dự án React Vite kết nối Node Express API. Đã có source repo GitHub sẵn.',
    result: {
      title: 'Fix lỗi CORS & Axios Refresh Token JWT cho dự án React Node',
      category: 'Lập trình & Đồ án',
      difficulty: 'Khá (Chuyên môn CNTT)',
      difficultyScore: 7.5,
      estimatedMinutes: 60,
      recommendedPrice: 150000,
      floorPrice: 120000,
      rushPrice: 220000,
      description: 'Hỗ trợ remote qua UltraViewer / Google Meet hoặc pull request trực tiếp trên Git. Yêu cầu test chạy mượt mà khi access token 15 phút hết hạn thì tự gọi api/refresh.',
      acceptanceChecklist: [
        'Cấu hình CORS middleware cho phép credentials và header',
        'Viết Axios Interceptor bắt mã lỗi 401 tự gọi refresh endpoint',
        'Lưu token an toàn vào httpOnly cookie hoặc memory',
        'Test live demo xác nhận đăng nhập không bị out phiên đột ngột',
      ],
      aiAnalysisNotes: 'Yêu cầu kỹ năng Web Fullstack thực chiến. Khung giá 150.000đ rất hợp lý cho 1 giờ fix bug thực chiến của sinh viên IT giỏi.',
    },
  },
  {
    id: 'english',
    name: 'Dịch Thuật & Sửa Bài IELTS',
    icon: Languages,
    category: 'Tư vấn & Học tập',
    sampleInput: 'Sửa ngữ pháp, nâng cấp từ vựng C1/C2 và cấu trúc câu cho bài luận IELTS Writing Task 2 dài 320 từ về chủ đề AI & Tự động hóa lao động.',
    result: {
      title: 'Proofread & Nâng cấp từ vựng C1 bài luận IELTS Task 2 (320 từ)',
      category: 'Tư vấn & Học tập',
      difficulty: 'Trung bình',
      difficultyScore: 5.5,
      estimatedMinutes: 30,
      recommendedPrice: 60000,
      floorPrice: 50000,
      rushPrice: 90000,
      description: 'Chữa chi tiết lỗi ngữ pháp, cải thiện Lexical Resource và Cohesion, giải thích lý do sửa và chấm điểm dự kiến theo 4 tiêu chí của IELTS Writing.',
      acceptanceChecklist: [
        'File Word bật chế độ Track Changes ghi rõ từng từ được sửa',
        'Gợi ý ít nhất 8 collocations và từ vựng band 7.0 - 8.0',
        'Nhận xét ngắn về cấu trúc lập luận và luận điểm phản biện',
      ],
      aiAnalysisNotes: 'Khối lượng 320 từ tương đương 1 bài tiêu chuẩn. Thời gian sửa hoàn tất trong 30 phút.',
    },
  },
  {
    id: 'design',
    name: 'Thiết Kế Banner & Poster',
    icon: Palette,
    category: 'Thiết kế & Đồ họa',
    sampleInput: 'Thiết kế 1 poster tuyển thành viên CLB Tình Nguyện định dạng A3 để in ấn và 1 banner ngang tỉ lệ 16:9 đăng fanpage Facebook, phong cách tươi sáng Gen Z.',
    result: {
      title: 'Thiết kế Poster A3 & Banner Facebook CLB Tình Nguyện Sinh Viên',
      category: 'Thiết kế & Đồ họa',
      difficulty: 'Trung bình - Sáng tạo',
      difficultyScore: 6.2,
      estimatedMinutes: 90,
      recommendedPrice: 160000,
      floorPrice: 120000,
      rushPrice: 230000,
      description: 'Bàn giao file thiết kế Canva Pro hoặc Photoshop/Illustrator (kèm file xuất ảnh PNG chất lượng cao và file PDF in ấn chuẩn màu CMYK).',
      acceptanceChecklist: [
        'Poster A3 độ phân giải 300 DPI chuẩn in màu',
        'Banner Cover Facebook 1200x630px rõ nét',
        'Bàn giao link file gốc có thể chỉnh sửa chữ và logo sau này',
        'Hỗ trợ chỉnh sửa nhẹ tối đa 2 lần',
      ],
      aiAnalysisNotes: 'Công việc bao gồm 2 kích thước ấn phẩm. Mức thù lao 160.000đ tương đương 80.000đ/ấn phẩm chuẩn mặt bằng sinh viên.',
    },
  },
];

interface GeminiTaskEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: {
    title: string;
    description: string;
    category: string;
    price: number;
    estimatedDurationMinutes: number;
    suggestedWorkers?: number;
  }) => void;
}

export const GeminiTaskEstimatorModal: React.FC<GeminiTaskEstimatorModalProps> = ({
  isOpen,
  onClose,
  onApplyData,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('math');
  const [customInputText, setCustomInputText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<TaskSamplePreset['result'] | null>(
    PRESET_SAMPLES[0].result
  );
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: TaskSamplePreset) => {
    setSelectedPresetId(preset.id);
    setCustomInputText(preset.sampleInput);
    setIsAnalyzing(true);
    setCurrentResult(null);

    // Mô phỏng Gemini 3.5 Flash xử lý phân tích và định giá tự động
    setTimeout(() => {
      setCurrentResult(preset.result);
      setIsAnalyzing(false);
    }, 600);
  };

  const handleAnalyzeCustom = () => {
    if (!customInputText.trim()) return;
    setIsAnalyzing(true);
    setCurrentResult(null);

    // Thuật toán AI phân tích từ khóa và ước tính giá
    setTimeout(() => {
      const text = customInputText.toLowerCase();
      let cat = 'Tư vấn & Học tập';
      let estPrice = 80000;
      let estMinutes = 45;
      let diff = 'Trung bình';
      let diffScore = 6.0;

      if (text.includes('code') || text.includes('bug') || text.includes('react') || text.includes('python') || text.includes('web') || text.includes('lập trình')) {
        cat = 'Lập trình & Đồ án';
        estPrice = 140000;
        estMinutes = 60;
        diff = 'Khá - Chuyên sâu CNTT';
        diffScore = 7.2;
      } else if (text.includes('vẽ') || text.includes('thiết kế') || text.includes('poster') || text.includes('canva') || text.includes('logo')) {
        cat = 'Thiết kế & Đồ họa';
        estPrice = 120000;
        estMinutes = 75;
        diff = 'Sáng tạo đồ họa';
        diffScore = 6.5;
      } else if (text.includes('dịch') || text.includes('tiếng anh') || text.includes('ielts') || text.includes('essay')) {
        cat = 'Tư vấn & Học tập';
        estPrice = 75000;
        estMinutes = 35;
        diff = 'Ngoại ngữ';
        diffScore = 5.8;
      } else if (text.includes('ship') || text.includes('giao') || text.includes('mua hộ') || text.includes('chở')) {
        cat = 'Vận chuyển & Ship';
        estPrice = 45000;
        estMinutes = 25;
        diff = 'Cơ bản - Hiện trường';
        diffScore = 3.5;
      }

      setCurrentResult({
        title: `Nhiệm vụ: ${customInputText.slice(0, 55)}...`,
        category: cat,
        difficulty: diff,
        difficultyScore: diffScore,
        estimatedMinutes: estMinutes,
        recommendedPrice: estPrice,
        floorPrice: Math.floor(estPrice * 0.75),
        rushPrice: Math.floor(estPrice * 1.45),
        description: `Đề bài: "${customInputText}". Yêu cầu thực hiện cẩn thận, đúng hạn, chụp ảnh hoặc bàn giao sản phẩm nghiệm thu rõ ràng.`,
        acceptanceChecklist: [
          'Hoàn thành đúng 100% nội dung đã cam kết',
          'Bàn giao đúng hạn, giải thích cặn kẽ nếu có thắc mắc',
          'Sản phẩm sạch sẽ, chất lượng cao chống tranh chấp',
        ],
        aiAnalysisNotes: `Gemini 3.5 Flash đã bóc tách ${customInputText.split(' ').length} từ khóa. Khuyến nghị mức giá ${estPrice.toLocaleString()}đ để có người nhận việc nhanh nhất.`,
      });
      setIsAnalyzing(false);
    }, 700);
  };

  const handleApply = () => {
    if (!currentResult) return;
    onApplyData({
      title: currentResult.title,
      description: currentResult.description,
      category: currentResult.category,
      price: currentResult.recommendedPrice,
      estimatedDurationMinutes: currentResult.estimatedMinutes,
      suggestedWorkers: 1,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-500/30 overflow-hidden my-6">
        {/* Header với dải màu AI Gradient */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
                <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold">Trợ Lý AI Định Giá & Phân Tích Đề Bài</h2>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-white/20 rounded-full border border-white/30 text-white">
                    Gemini 3.5 Flash
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5">
                  Phân tích độ khó, thời gian hoàn thành & gợi ý mức giá tối ưu không sợ bị hớ
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Chọn mẫu đề bài có sẵn */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Chọn đề bài mẫu phổ biến hoặc dán nội dung:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_SAMPLES.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-start ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold leading-snug">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ô nhập đề bài / mô tả bài tập */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Nội dung bài tập hoặc mô tả công việc:
              </label>
              <button
                onClick={() => setCustomInputText('')}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa trắng</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={customInputText || PRESET_SAMPLES.find(p => p.id === selectedPresetId)?.sampleInput || ''}
              onChange={(e) => {
                setCustomInputText(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="Dán câu hỏi, đề bài tập hoặc mô tả công việc cần thuê vào đây..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                💡 AI tự động nhận diện từ khóa môn học và tính độ phức tạp
              </span>
              <button
                onClick={handleAnalyzeCustom}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'Đang phân tích...' : 'AI Phân Tích Lại'}</span>
              </button>
            </div>
          </div>

          {/* Trạng thái phân tích loading */}
          {isAnalyzing && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Gemini 3.5 Flash đang quét đề bài & đối chiếu giá thị trường...
              </p>
            </div>
          )}

          {/* Kết quả phân tích từ AI */}
          {!isAnalyzing && currentResult && (
            <div className="space-y-4 animate-fadeIn">
              {/* Bảng giá 3 cấp độ */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* Giá Sàn */}
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
                    Giá Sàn Tiết Kiệm
                  </span>
                  <div className="text-base font-extrabold text-slate-700 dark:text-slate-200">
                    {currentResult.floorPrice.toLocaleString()}đ
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Chờ 1-3 tiếng</span>
                </div>

                {/* Giá Đề Xuất Tối Ưu */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border-2 border-blue-500 text-center shadow-sm relative">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow">
                    ⭐ KHUYÊN DÙNG
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">
                    Giá Chuẩn AI
                  </span>
                  <div className="text-lg font-black text-blue-700 dark:text-blue-300">
                    {currentResult.recommendedPrice.toLocaleString()}đ
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                    Chốt kèo trong 10 phút
                  </span>
                </div>

                {/* Giá Hỏa Tốc */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-center">
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 block mb-0.5">
                    Giá Hỏa Tốc Cấp Cứu
                  </span>
                  <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {currentResult.rushPrice.toLocaleString()}đ
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 block mt-0.5">Làm liền ngay</span>
                </div>
              </div>

              {/* Thông số chi tiết */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block">Độ khó:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {currentResult.difficulty} ({currentResult.difficultyScore}/10)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <span className="text-slate-400 block">Thời gian ước tính:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ~{currentResult.estimatedMinutes} phút làm việc
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nhận xét AI */}
                <div className="text-xs p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-200 leading-relaxed">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Nhận định thông minh của Gemini:
                  </span>
                  {currentResult.aiAnalysisNotes}
                </div>

                {/* Tiêu chuẩn nghiệm thu khuyến nghị */}
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Check-list nghiệm thu chống tranh chấp:</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {currentResult.acceptanceChecklist.map((item, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Đóng Lại
          </button>
          <button
            onClick={handleApply}
            disabled={!currentResult || isAnalyzing}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>Áp Dụng Định Giá Vào Đăng Kèo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
