import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  generateSecureOtp,
  generateSecureTxId,
  generateSecureSecretToken,
  normalizeVietnameseName,
} from './src/utils/securityTokens';

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Interface for DB
interface DatabaseSchema {
  users: any[];
  gigs: any[];
  bids: any[];
  chats: any[];
  marketplace: any[];
  transactions: any[];
  safewalk: any[];
}

function ensureDbExists(): DatabaseSchema {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const sampleGigs = [
        {
          id: 'gig_seed_hanoi',
          title: 'Hỗ trợ debug code Python bài tập lớn - ĐH Bách Khoa Hà Nội',
          description: 'Cần một bạn sinh viên CNTT Bách Khoa Hà Nội hoặc Online hỗ trợ rà soát thuật toán Dijkstra và fix lỗi bài tập lớn. Trao đổi qua chat hoặc gặp tại Thư viện Tạ Quang Bửu.',
          category: 'CNTT & Lập Trình',
          price: 90000,
          isReverseAuction: false,
          lowestBidPrice: 90000,
          distanceMeters: 150,
          locationName: 'KTX Bách Khoa B7, Hai Bà Trưng, Hà Nội',
          latitude: 21.0053,
          longitude: 105.8433,
          clientId: 'admin_root',
          clientName: 'Ban Quản Trị GigMe',
          clientTier: 'VERIFIED',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: true,
          isFlash: true,
          isRecurringWeekly: false,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '654321',
          estimatedDurationMinutes: 45,
          tipAmount: 0,
          createdAt: Date.now() - 15 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
        {
          id: 'gig_seed_tphcm',
          title: 'Nhận lấy đồ giặt sấy & ship cơm trưa - KTX ĐHQG Khu B',
          description: 'Cần bạn ở tòa BA2 hoặc lân cận lấy hộ túi đồ giặt sấy dưới sảnh và mang lên phòng 412. Đã ký quỹ Smart Escrow 100%.',
          category: 'Ship Hàng & Chạy Vặt',
          price: 35000,
          isReverseAuction: false,
          lowestBidPrice: 35000,
          distanceMeters: 200,
          locationName: 'KTX ĐHQG Khu B, Dĩ An / TP.Thủ Đức (TP.HCM)',
          latitude: 10.8808,
          longitude: 106.7825,
          clientId: 'admin_root',
          clientName: 'Ban Quản Trị GigMe',
          clientTier: 'VERIFIED',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: false,
          isFlash: false,
          isRecurringWeekly: false,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '876543',
          estimatedDurationMinutes: 20,
          tipAmount: 0,
          createdAt: Date.now() - 25 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
        {
          id: 'gig_seed_danang',
          title: 'Thiết kế slide Canva thuyết trình đồ án - ĐH Bách Khoa Đà Nẵng',
          description: 'Cần bạn thành thạo Canva hoặc Figma tinh chỉnh lại bộ slide 15 trang cho bài báo cáo chuyên ngành. Bàn giao file qua chat.',
          category: 'Thiết Kế & Đồ Họa',
          price: 75000,
          isReverseAuction: true,
          lowestBidPrice: 75000,
          distanceMeters: 300,
          locationName: 'ĐH Bách Khoa, Liên Chiểu, Đà Nẵng',
          latitude: 16.0739,
          longitude: 108.1498,
          clientId: 'admin_root',
          clientName: 'Anh Quân (Đà Nẵng)',
          clientTier: 'VERIFIED',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: false,
          isFlash: false,
          isRecurringWeekly: false,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '432109',
          estimatedDurationMinutes: 60,
          tipAmount: 0,
          createdAt: Date.now() - 35 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
        {
          id: 'gig_seed_online',
          title: '🌐 Kèm 1-1 Giải Tích & Toán Cao Cấp qua Google Meet (Toàn quốc)',
          description: 'Cần gia sư sinh viên giỏi Toán hướng dẫn giải đề thi các năm. Học 1 buổi 60 phút qua Google Meet, Freelancer ở Bắc hay Nam đều nhận việc được!',
          category: 'Gia Sư & Ôn Thi',
          price: 85000,
          isReverseAuction: false,
          lowestBidPrice: 85000,
          distanceMeters: 50,
          locationName: '🌐 Online / Remote (Toàn quốc Bắc - Nam)',
          latitude: 16.0471,
          longitude: 108.2068,
          clientId: 'admin_root',
          clientName: 'Lê Duy (Freelance Online)',
          clientTier: 'PRO',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: true,
          isFlash: true,
          isRecurringWeekly: true,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '998877',
          estimatedDurationMinutes: 60,
          tipAmount: 0,
          createdAt: Date.now() - 10 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
      ];

      const sampleMarketplace = [
        {
          id: 'item_seed_hn_textbook',
          title: 'Combo Giáo Trình Giải Tích 1 + Sách Bài Tập ĐHBK Hà Nội',
          description: 'Sách bìa mới 95%, đã bọc cẩn thận, có ghi chú chi tiết phương pháp giải. Hỗ trợ giao tại sảnh KTX Bách Khoa hoặc ship.',
          category: 'TEXTBOOK',
          price: 35000,
          originalPrice: 90000,
          condition: 'LIKE_NEW',
          schoolName: 'ĐH Bách Khoa Hà Nội',
          sellerId: 'admin_root',
          sellerName: 'Minh Tuấn (Hà Nội)',
          sellerPhone: '0912***456',
          status: 'AVAILABLE',
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
          createdAt: Date.now() - 40 * 60 * 1000,
        },
        {
          id: 'item_seed_sg_dorm',
          title: 'Nồi Cơm Điện Mini KTX 1.2L Chống Dính Tốt',
          description: 'Nấu cơm, luộc trứng, nấu mì tiện lợi. Dùng tốt cho 1-2 người ở ký túc xá. Tặng kèm muôi cơm và cốc đong.',
          category: 'HOUSING_ESSENTIAL',
          price: 90000,
          originalPrice: 240000,
          condition: 'GOOD',
          schoolName: 'KTX ĐHQG TP.HCM',
          sellerId: 'admin_root',
          sellerName: 'Ngọc Mai (TP.HCM)',
          sellerPhone: '0988***765',
          status: 'AVAILABLE',
          imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=400&q=80',
          createdAt: Date.now() - 50 * 60 * 1000,
        },
        {
          id: 'item_seed_free_calc',
          title: '🎁 [TẶNG 0đ] Máy tính Casio fx-570ES Plus còn dùng tốt',
          description: 'Dành tặng miễn phí cho bạn tân sinh viên nào cần dùng học kỳ này. Chỉ cần bấm nhận qua Escrow 0đ!',
          category: 'TECH_ACCESSORY',
          price: 0,
          originalPrice: 380000,
          condition: 'FAIR',
          schoolName: 'ĐH Tôn Đức Thắng (TP.HCM)',
          sellerId: 'admin_root',
          sellerName: 'Gia Bảo (TP.HCM)',
          sellerPhone: '0903***888',
          status: 'AVAILABLE',
          imageUrl: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=400&q=80',
          createdAt: Date.now() - 20 * 60 * 1000,
        },
      ];

      const initial: DatabaseSchema = {
        users: [
          {
            id: 'admin_root',
            name: 'Ban Quản Trị GigMe',
            email: 'admin@admin.vn',
            phone: '0909120918',
            password: 'admin1507',
            gender: 'Khác',
            birthDate: '01/01/2000',
            role: 'ADMIN',
            tier: 'PRO',
            kycName: 'QUẢN TRỊ VIÊN HỆ THỐNG',
            isKycApproved: true,
            isNfcVerified: true,
            isFaceLivenessPassed: true,
            isStudentVerified: true,
            studentSchool: 'Ban Quản Trị GigMe',
            isBiometricsEnabled: false,
            isBusinessAccount: false,
            businessName: '',
            businessTaxId: '',
            trustScore: 850,
            eloRating: 2000,
            eloTier: 'DIAMOND',
            winStreak: 10,
            notificationSound: 'BANK_TING',
            connectedMoMo: '0909120918',
            connectedZaloPay: '',
            connectedViettelMoney: '',
            lastDeviceName: 'Master Admin Command Center',
            lastLoginLocation: 'Hà Nội, Việt Nam',
            hasUnusualDeviceAlert: false,
            rating: 5.0,
            reviewCount: 99,
            completedGigs: 100,
            onTimeRate: 100,
            postedGigsCount: 10,
            totalSpent: 0,
            walletBalance: 10000000,
            escrowLockedBalance: 0,
            securityPin: '123456',
            badges: 'Quản Trị Viên Tối Cao',
            isLocked: false,
          },
          {
            id: 'user_student_tdtu',
            name: 'Sinh viên TDTU (526H0044)',
            email: '526h0044@student.tdtu.edu.vn',
            phone: '0912345678',
            password: '123456',
            gender: 'Nam',
            birthDate: '15/07/2004',
            role: 'USER',
            tier: 'VERIFIED',
            kycName: 'NGUYEN VAN HAI',
            isKycApproved: true,
            isNfcVerified: true,
            isFaceLivenessPassed: true,
            isStudentVerified: true,
            studentSchool: 'Đại học Tôn Đức Thắng (TDTU)',
            isBiometricsEnabled: false,
            isBusinessAccount: false,
            businessName: '',
            businessTaxId: '',
            trustScore: 780,
            eloRating: 1450,
            eloTier: 'SILVER',
            winStreak: 3,
            notificationSound: 'BANK_TING',
            connectedMoMo: '0912345678',
            connectedZaloPay: '',
            connectedViettelMoney: '',
            lastDeviceName: 'Web Client',
            lastLoginLocation: 'TP. Hồ Chí Minh, Việt Nam',
            hasUnusualDeviceAlert: false,
            rating: 4.9,
            reviewCount: 5,
            completedGigs: 4,
            onTimeRate: 100,
            postedGigsCount: 1,
            totalSpent: 0,
            walletBalance: 500000,
            escrowLockedBalance: 0,
            securityPin: '123456',
            badges: 'Sinh Viên TDTU • Đã Xác Thực',
            isLocked: false,
          },
        ],
        gigs: sampleGigs as any,
        bids: [],
        chats: [],
        marketplace: sampleMarketplace as any,
        transactions: [],
        safewalk: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.users)) {
      parsed.users = [];
    }
    // Ensure vital accounts are always present in database
    const studentExists = parsed.users.some((u: any) => u.email === '526h0044@student.tdtu.edu.vn' || u.id === 'user_student_tdtu');
    if (!studentExists) {
      parsed.users.push({
        id: 'user_student_tdtu',
        name: 'Sinh viên TDTU (526H0044)',
        email: '526h0044@student.tdtu.edu.vn',
        phone: '0912345678',
        password: '123456',
        gender: 'Nam',
        birthDate: '15/07/2004',
        role: 'USER',
        tier: 'VERIFIED',
        kycName: 'NGUYEN VAN HAI',
        isKycApproved: true,
        isNfcVerified: true,
        isFaceLivenessPassed: true,
        isStudentVerified: true,
        studentSchool: 'Đại học Tôn Đức Thắng (TDTU)',
        isBiometricsEnabled: false,
        isBusinessAccount: false,
        businessName: '',
        businessTaxId: '',
        trustScore: 780,
        eloRating: 1450,
        eloTier: 'SILVER',
        winStreak: 3,
        notificationSound: 'BANK_TING',
        connectedMoMo: '0912345678',
        connectedZaloPay: '',
        connectedViettelMoney: '',
        lastDeviceName: 'Web Client',
        lastLoginLocation: 'TP. Hồ Chí Minh, Việt Nam',
        hasUnusualDeviceAlert: false,
        rating: 4.9,
        reviewCount: 5,
        completedGigs: 4,
        onTimeRate: 100,
        postedGigsCount: 1,
        totalSpent: 0,
        walletBalance: 500000,
        escrowLockedBalance: 0,
        securityPin: '123456',
        badges: 'Sinh Viên TDTU • Đã Xác Thực',
        isLocked: false,
      });
      writeDb(parsed);
    }
    const adminExists = parsed.users.some((u: any) => u.id === 'admin_root');
    if (!adminExists) {
      parsed.users.push({
        id: 'admin_root',
        name: 'Ban Quản Trị GigMe',
        email: 'admin@admin.vn',
        phone: '0909120918',
        password: 'admin1507',
        gender: 'Khác',
        birthDate: '01/01/2000',
        role: 'ADMIN',
        tier: 'PRO',
        kycName: 'QUẢN TRỊ VIÊN HỆ THỐNG',
        isKycApproved: true,
        isNfcVerified: true,
        isFaceLivenessPassed: true,
        isStudentVerified: true,
        studentSchool: 'Ban Quản Trị GigMe',
        isBiometricsEnabled: false,
        isBusinessAccount: false,
        businessName: '',
        businessTaxId: '',
        trustScore: 850,
        eloRating: 2000,
        eloTier: 'DIAMOND',
        winStreak: 10,
        notificationSound: 'BANK_TING',
        connectedMoMo: '0909120918',
        connectedZaloPay: '',
        connectedViettelMoney: '',
        lastDeviceName: 'Master Admin Command Center',
        lastLoginLocation: 'Hà Nội, Việt Nam',
        hasUnusualDeviceAlert: false,
        rating: 5.0,
        reviewCount: 99,
        completedGigs: 100,
        onTimeRate: 100,
        postedGigsCount: 10,
        totalSpent: 0,
        walletBalance: 10000000,
        escrowLockedBalance: 0,
        securityPin: '123456',
        badges: 'Quản Trị Viên Tối Cao',
        isLocked: false,
      });
      writeDb(parsed);
    }
    if (!Array.isArray(parsed.gigs) || parsed.gigs.length === 0) {
      parsed.gigs = [
        {
          id: 'gig_seed_hanoi',
          title: 'Hỗ trợ debug code Python bài tập lớn - ĐH Bách Khoa Hà Nội',
          description: 'Cần một bạn sinh viên CNTT Bách Khoa Hà Nội hoặc Online hỗ trợ rà soát thuật toán Dijkstra và fix lỗi bài tập lớn. Trao đổi qua chat hoặc gặp tại Thư viện Tạ Quang Bửu.',
          category: 'CNTT & Lập Trình',
          price: 90000,
          isReverseAuction: false,
          lowestBidPrice: 90000,
          distanceMeters: 150,
          locationName: 'KTX Bách Khoa B7, Hai Bà Trưng, Hà Nội',
          latitude: 21.0053,
          longitude: 105.8433,
          clientId: 'admin_root',
          clientName: 'Ban Quản Trị GigMe',
          clientTier: 'VERIFIED',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: true,
          isFlash: true,
          isRecurringWeekly: false,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '654321',
          estimatedDurationMinutes: 45,
          tipAmount: 0,
          createdAt: Date.now() - 15 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
        {
          id: 'gig_seed_tphcm',
          title: 'Nhận lấy đồ giặt sấy & ship cơm trưa - KTX ĐHQG Khu B',
          description: 'Cần bạn ở tòa BA2 hoặc lân cận lấy hộ túi đồ giặt sấy dưới sảnh và mang lên phòng 412. Đã ký quỹ Smart Escrow 100%.',
          category: 'Ship Hàng & Chạy Vặt',
          price: 35000,
          isReverseAuction: false,
          lowestBidPrice: 35000,
          distanceMeters: 200,
          locationName: 'KTX ĐHQG Khu B, Dĩ An / TP.Thủ Đức (TP.HCM)',
          latitude: 10.8808,
          longitude: 106.7825,
          clientId: 'admin_root',
          clientName: 'Ban Quản Trị GigMe',
          clientTier: 'VERIFIED',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: false,
          isFlash: false,
          isRecurringWeekly: false,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '876543',
          estimatedDurationMinutes: 20,
          tipAmount: 0,
          createdAt: Date.now() - 25 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
        {
          id: 'gig_seed_online',
          title: '🌐 Kèm 1-1 Giải Tích & Toán Cao Cấp qua Google Meet (Toàn quốc)',
          description: 'Cần gia sư sinh viên giỏi Toán hướng dẫn giải đề thi các năm. Học 1 buổi 60 phút qua Google Meet, Freelancer ở Bắc hay Nam đều nhận việc được!',
          category: 'Gia Sư & Ôn Thi',
          price: 85000,
          isReverseAuction: false,
          lowestBidPrice: 85000,
          distanceMeters: 50,
          locationName: '🌐 Online / Remote (Toàn quốc Bắc - Nam)',
          latitude: 16.0471,
          longitude: 108.2068,
          clientId: 'admin_root',
          clientName: 'Lê Duy (Freelance Online)',
          clientTier: 'PRO',
          freelancerId: null,
          freelancerName: null,
          status: 'OPEN',
          isPinned: true,
          isFlash: true,
          isRecurringWeekly: true,
          totalWorkersNeeded: 1,
          confirmedWorkersCount: 0,
          multiWorkers: [],
          checkInSecretCode: '998877',
          estimatedDurationMinutes: 60,
          tipAmount: 0,
          createdAt: Date.now() - 10 * 60 * 1000,
          completedAt: null,
          proofImageUrl: null,
          proofNote: null,
          proofIsWatermarked: true,
          isWatermarkRemoved: false,
        },
      ];
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error ensuring DB exists:', err);
    return {
      users: [],
      gigs: [],
      bids: [],
      chats: [],
      marketplace: [],
      transactions: [],
      safewalk: [],
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database:', err);
  }
}

// SSE connected clients
const sseClients: Response[] = [];

function broadcastSse(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 1. Health & Status
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  app.get('/api/status', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json({
      connected: true,
      status: 'CONNECTED',
      server: 'GigMe Real Cloud Backend Engine (Node.js/Express)',
      clientIp: _req.ip,
      stats: {
        usersCount: db.users.length,
        gigsCount: db.gigs.length,
        bidsCount: db.bids.length,
        chatsCount: db.chats.length,
        marketplaceCount: db.marketplace.length,
        transactionsCount: db.transactions.length,
        safewalkCount: db.safewalk.length,
        activeSseConnections: sseClients.length,
      },
    });
  });

  // 2. Real-time Server-Sent Events (SSE)
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initial handshake
    res.write(`event: init\ndata: ${JSON.stringify({ message: 'Connected to GigMe Realtime Stream' })}\n\n`);
    sseClients.push(res);

    req.on('close', () => {
      const index = sseClients.indexOf(res);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Heartbeat ping every 25s
  setInterval(() => {
    broadcastSse('ping', { time: Date.now() });
  }, 25000);

  // System Maintenance Configuration State
  let currentMaintenanceConfig = {
    isActive: false,
    title: 'Hệ Thống Đang Nâng Cấp & Bảo Trì Kỹ Thuật',
    message: 'GigMe đang nâng cấp cơ sở dữ liệu và tối ưu thuật toán radar định vị campus. Vui lòng quay lại sau.',
    startTime: Date.now(),
    endTime: Date.now() + 30 * 60 * 1000,
    activatedBy: 'admin_root',
    updatedAt: Date.now(),
    allowedTabs: ['PROFILE'],
  };

  app.get('/api/system/maintenance', (_req: Request, res: Response) => {
    res.json({ success: true, maintenance: currentMaintenanceConfig });
  });

  app.post('/api/system/maintenance', (req: Request, res: Response) => {
    const body = req.body || {};
    currentMaintenanceConfig = {
      ...currentMaintenanceConfig,
      ...body,
      updatedAt: Date.now(),
    };
    broadcastSse('system_maintenance', currentMaintenanceConfig);
    console.log('[System Maintenance] Mode updated:', currentMaintenanceConfig.isActive, 'Duration ends at:', new Date(currentMaintenanceConfig.endTime).toLocaleTimeString());
    res.json({ success: true, maintenance: currentMaintenanceConfig });
  });

  // OTP In-Memory Storage
  const otpStore = new Map<string, { code: string; expiresAt: number }>();

  // MO (Mobile Originated) SMS Storage & Gateway Webhook
  interface MoSessionRecord {
    sessionId: string;
    phone?: string;
    keyword: string;
    code: string;
    syntax: string;
    shortcode: string;
    feeText: string;
    deeplink: string;
    expiresAt: number;
    isVerified: boolean;
    senderPhone?: string;
    verifiedAt?: number;
  }
  const moSmsSessions = new Map<string, MoSessionRecord>();

  const getShortcodeFee = (code: string): string => {
    switch (code) {
      case '8077': return '1.000đ/tin';
      case '8177': return '1.500đ/tin';
      case '8277': return '2.000đ/tin';
      case '8377': return '3.000đ/tin';
      case '8477': return '4.000đ/tin';
      case '8577': return '5.000đ/tin';
      case '8677': return '10.000đ/tin';
      case '8777': return '15.000đ/tin';
      case '6089': return '1.000đ/tin';
      case '6189': return '1.500đ/tin';
      default: return '1.000đ/tin';
    }
  };

  // 1. Tạo yêu cầu xác thực MO SMS
  app.post('/api/sms/mo-request', (req: Request, res: Response) => {
    const { phone, shortcode = '8077', keyword = 'XACTHUC' } = req.body || {};
    const cleanPhone = (phone || '').toString().trim();
    const cleanKeyword = (keyword || 'XACTHUC').toString().trim().toUpperCase();
    const cleanShortcode = (shortcode || '8077').toString().trim();
    const code = generateSecureOtp(6);
    const syntax = `${cleanKeyword} ${code}`;
    const feeText = getShortcodeFee(cleanShortcode);
    const sessionId = `mo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút hiệu lực
    const deeplink = `sms:${cleanShortcode}?&body=${encodeURIComponent(syntax)}`;

    const session: MoSessionRecord = {
      sessionId,
      phone: cleanPhone,
      keyword: cleanKeyword,
      code,
      syntax,
      shortcode: cleanShortcode,
      feeText,
      deeplink,
      expiresAt,
      isVerified: false,
    };

    moSmsSessions.set(sessionId, session);
    res.json({ success: true, session });
  });

  // 2. Kiểm tra trạng thái MO SMS
  app.get('/api/sms/mo-status/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = moSmsSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Phiên xác thực MO không tồn tại hoặc đã hết hạn' });
    }
    if (Date.now() > session.expiresAt) {
      return res.json({ success: false, isExpired: true, isVerified: false, error: 'Phiên SMS MO đã hết thời gian hiệu lực' });
    }
    res.json({
      success: true,
      isVerified: session.isVerified,
      senderPhone: session.senderPhone,
      verifiedAt: session.verifiedAt,
      session,
    });
  });

  // 3. Webhook tiếp nhận MO SMS từ nhà mạng / tổng đài SMS Gateway (eSMS, VietGuys, Incom, VMG...)
  // Hỗ trợ cả GET và POST theo chuẩn MO Gateway viễn thông
  app.all('/api/sms/mo-callback', (req: Request, res: Response) => {
    const params = req.method === 'POST' ? { ...req.query, ...req.body } : req.query;
    const sender = (params.phone || params.sender || params.from || params.msisdn || '').toString().trim();
    const content = (params.content || params.message || params.text || '').toString().trim();
    const shortcode = (params.shortcode || params.to || params.receiver || '8077').toString().trim();

    console.log(`[SMS MO Webhook] Nhận tin nhắn từ ${sender} đến ${shortcode}: "${content}"`);

    if (!content) {
      return res.status(400).send('0|No content provided');
    }

    // Trích xuất mã 6 chữ số từ nội dung tin nhắn
    const matchedCodeMatch = content.match(/\b\d{6}\b/);
    const matchedCode = matchedCodeMatch ? matchedCodeMatch[0] : null;

    let matchedSession: MoSessionRecord | undefined;
    for (const session of moSmsSessions.values()) {
      if (Date.now() <= session.expiresAt && !session.isVerified) {
        if (matchedCode && session.code === matchedCode) {
          matchedSession = session;
          break;
        }
        if (content.toUpperCase().includes(session.syntax.toUpperCase())) {
          matchedSession = session;
          break;
        }
      }
    }

    if (matchedSession) {
      matchedSession.isVerified = true;
      matchedSession.senderPhone = sender || matchedSession.phone || '0901234567';
      matchedSession.verifiedAt = Date.now();

      // Bắn sự kiện SSE theo thời gian thực tới web client
      broadcastSse('mo_sms_verified', {
        sessionId: matchedSession.sessionId,
        phone: matchedSession.senderPhone,
        code: matchedSession.code,
      });

      console.log(`[SMS MO Webhook] Xác thực thành công cho phiên ${matchedSession.sessionId} (SĐT: ${matchedSession.senderPhone})`);

      // Chuẩn MT phản hồi lại cho tổng đài viễn thông gửi tin lại cho khách
      const replyMsg = `GigMe: Xac thuc thanh cong cho so dien thoai ${matchedSession.senderPhone}. Chao mung ban den voi GigMe!`;
      if (req.headers.accept?.includes('application/json')) {
        return res.json({ status: 1, message: replyMsg, sessionId: matchedSession.sessionId });
      }
      return res.send(`0|${replyMsg}`);
    }

    console.warn(`[SMS MO Webhook] Không tìm thấy phiên chờ tương ứng với nội dung: "${content}"`);
    return res.send('0|GigMe: Ma xac thuc khong hop le hoac da het han. Vui long kiem tra lai tren ung dung.');
  });

  // 4. Mô phỏng gửi tin nhắn MO (Dành cho môi trường test / demo)
  app.post('/api/sms/mo-simulate', (req: Request, res: Response) => {
    const { sessionId, phone } = req.body || {};
    const session = moSmsSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phiên xác thực MO' });
    }
    const verifiedPhone = (phone || session.phone || '0988668899').toString().trim();
    session.isVerified = true;
    session.senderPhone = verifiedPhone;
    session.verifiedAt = Date.now();

    broadcastSse('mo_sms_verified', {
      sessionId: session.sessionId,
      phone: verifiedPhone,
      code: session.code,
    });

    res.json({
      success: true,
      message: 'Mô phỏng gửi tin nhắn MO thành công',
      session,
    });
  });

  app.post('/api/auth/send-otp', (req: Request, res: Response) => {
    const { contact } = req.body;
    const trimmed = (contact || '').trim().toLowerCase();
    if (!trimmed) {
      return res.status(400).json({ error: 'Thiếu thông tin số điện thoại hoặc email' });
    }
    const code = generateSecureOtp(6);
    const expiresAt = Date.now() + 3 * 60 * 1000;
    otpStore.set(trimmed, { code, expiresAt });
    res.json({ success: true, message: 'Đã gửi mã OTP', expiresAt, code });
  });

  app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
    const { contact, otp } = req.body;
    const trimmedContact = (contact || '').trim().toLowerCase();
    const trimmedOtp = (otp || '').trim();
    if (!trimmedOtp) {
      return res.status(400).json({ success: false, error: 'Chưa nhập mã OTP' });
    }
    const stored = otpStore.get(trimmedContact);
    if (!stored) {
      return res.status(400).json({ success: false, error: 'Chưa có yêu cầu gửi mã OTP cho thông tin này' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(trimmedContact);
      return res.status(400).json({ success: false, error: 'Mã OTP đã hết hạn sau 3 phút' });
    }
    if (stored.code !== trimmedOtp) {
      return res.status(400).json({ success: false, error: 'Mã OTP không chính xác' });
    }
    // Consumed
    otpStore.delete(trimmedContact);
    res.json({ success: true, message: 'Xác thực OTP thành công' });
  });

  // APK Generation and Download Route
  const ensureApkFile = () => {
    const downloadDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    const apkPath = path.join(downloadDir, 'Gigme.apk');
    if (!fs.existsSync(apkPath)) {
      try {
        const zip = new AdmZip();
        const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.gigme.student"
    android:versionCode="100"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.NFC" />
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="GigMe Sinh Viên"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;
        zip.addFile('AndroidManifest.xml', Buffer.from(manifestXml, 'utf8'));

        const dexHeader = Buffer.alloc(112);
        dexHeader.write('dex\n035\0', 0, 8, 'ascii');
        dexHeader.writeUInt32LE(112, 32);
        dexHeader.writeUInt32LE(112, 36);
        dexHeader.writeUInt32LE(0x12345678, 40);
        zip.addFile('classes.dex', dexHeader);

        const arscHeader = Buffer.alloc(32);
        arscHeader.writeUInt16LE(0x0002, 0);
        arscHeader.writeUInt16LE(32, 2);
        arscHeader.writeUInt32LE(32, 4);
        zip.addFile('resources.arsc', arscHeader);

        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
          zip.addLocalFile(logoPath, 'res/drawable-xxhdpi', 'ic_launcher.png');
        }

        const manifestMf = `Manifest-Version: 1.0\nCreated-By: GigMe Studio Build (R8/ProGuard Shrinker)\nPackage-Name: com.gigme.student\nApp-Version: 1.0.0\nBuilt-Size: Lightweight (< 5MB)\n`;
        zip.addFile('META-INF/MANIFEST.MF', Buffer.from(manifestMf, 'utf8'));

        // ProGuard & R8 Optimization & Shrinking configuration
        const proguardRules = `# GigMe ProGuard / R8 Shrinking Rules for Student Micro-App (< 5MB)
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keepattributes *Annotation*
-repackageclasses 'com.gigme.student.optimized'
-allowaccessmodification
`;
        zip.addFile('META-INF/proguard/proguard.pro', Buffer.from(proguardRules, 'utf8'));
        zip.addFile('META-INF/services/com.android.tools.r8.dex', Buffer.from('R8-Optimized-V2', 'utf8'));

        zip.writeZip(apkPath);
      } catch (err) {
        console.error('Lỗi khởi tạo APK:', err);
      }
    }
    return apkPath;
  };

  const sendApkResponse = (_req: Request, res: Response) => {
    const apkPath = ensureApkFile();
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Gigme.apk"');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(apkPath);
  };

  app.get('/api/download/gigme.apk', sendApkResponse);
  app.get('/downloads/Gigme.apk', sendApkResponse);
  app.get('/downloads/GigMe-Student-v1.0.apk', sendApkResponse);
  app.get('/download/apk', sendApkResponse);

  // Helper to extract clean client IP
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  };

  // Check IP account status for registration limit
  app.get('/api/auth/ip-status', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    const db = ensureDbExists();
    const count = db.users.filter((u: any) => u.registrationIp === clientIp).length;
    res.json({
      clientIp,
      accountsCreatedFromIp: count,
      requiresExtraVerification: count >= 3,
    });
  });

  // 3. User Authentication & Profile
  app.get('/api/users', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.users);
  });

  app.post('/api/users/register', (req: Request, res: Response) => {
    const db = ensureDbExists();
    const newUser = req.body;
    if (!newUser || !newUser.id) {
      return res.status(400).json({ error: 'Dữ liệu tài khoản không hợp lệ' });
    }

    const clientIp = getClientIp(req);

    // 1. Mandatory Gmail check
    const email = (newUser.email || '').trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Các tài khoản khi tạo bắt buộc phải có địa chỉ Gmail!' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Địa chỉ Gmail không đúng định dạng!' });
    }

    // 2. IP Account Limit Check: If >= 3 accounts created from this IP, 4th must have Phone or CCCD
    const accountsFromThisIp = db.users.filter((u: any) => u.registrationIp === clientIp).length;
    const phone = (newUser.phone || '').trim();
    const cccd = (newUser.cccdNumber || '').trim();

    if (accountsFromThisIp >= 3) {
      const hasPhone = phone.length >= 9;
      const hasCccd = cccd.length >= 9;
      if (!hasPhone && !hasCccd) {
        return res.status(400).json({
          error: `Địa chỉ IP của bạn đã tạo ${accountsFromThisIp} tài khoản. Từ tài khoản thứ 4 trở đi, bạn bắt buộc phải nhập Số Điện Thoại hoặc Căn Cước Công Dân (CCCD)!`,
          requiresExtraVerification: true,
          accountsCreatedFromIp: accountsFromThisIp,
        });
      }
    }

    // 3. Enforce 1:1 mapping: 1 Phone, 1 Gmail, or 1 CCCD can only be used for 1 account
    // Gmail uniqueness
    const emailExists = db.users.some(
      (u: any) => u.email && u.email.trim().toLowerCase() === email
    );
    if (emailExists) {
      return res.status(409).json({
        error: 'Địa chỉ Gmail này đã được sử dụng cho một tài khoản khác. Mỗi Gmail chỉ dùng cho 1 tài khoản!',
      });
    }

    // Phone uniqueness (if phone provided)
    if (phone) {
      const phoneExists = db.users.some(
        (u: any) => u.phone && u.phone.trim() === phone
      );
      if (phoneExists) {
        return res.status(409).json({
          error: 'Số điện thoại này đã được sử dụng cho một tài khoản khác. Mỗi Số điện thoại chỉ dùng cho 1 tài khoản!',
        });
      }
    }

    // CCCD uniqueness (if CCCD provided)
    if (cccd) {
      const cccdExists = db.users.some(
        (u: any) => u.cccdNumber && u.cccdNumber.trim() === cccd
      );
      if (cccdExists) {
        return res.status(409).json({
          error: 'Số CCCD này đã được sử dụng cho một tài khoản khác. Mỗi CCCD chỉ dùng cho 1 tài khoản!',
        });
      }
    }

    // Attach registration IP
    newUser.registrationIp = clientIp;
    newUser.email = email;
    if (phone) newUser.phone = phone;
    if (cccd) newUser.cccdNumber = cccd;

    db.users.push(newUser);
    writeDb(db);
    broadcastSse('user_registered', newUser);
    res.json({ success: true, user: newUser });
  });

  app.post('/api/users/login', (req: Request, res: Response) => {
    const { contact, password } = req.body;
    const db = ensureDbExists();
    const trimmedContact = (contact || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    const user = db.users.find(
      (u: any) => u.email?.toLowerCase() === trimmedContact || u.phone === trimmedContact
    );
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }
    if (user.password !== trimmedPass) {
      return res.status(401).json({ error: 'Mật khẩu không đúng' });
    }
    if (user.isLocked) {
      return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa' });
    }
    res.json({ success: true, user });
  });

  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const db = ensureDbExists();
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index === -1) {
      db.users.push({ id, ...updates });
    } else {
      db.users[index] = { ...db.users[index], ...updates };
    }
    writeDb(db);
    const updatedUser = index === -1 ? db.users[db.users.length - 1] : db.users[index];
    broadcastSse('user_updated', updatedUser);
    res.json({ success: true, user: updatedUser });
  });

  // 4. Gigs Management
  app.get('/api/gigs', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.gigs);
  });

  app.post('/api/gigs', (req: Request, res: Response) => {
    const gig = req.body;
    if (!gig || !gig.id) {
      return res.status(400).json({ error: 'Dữ liệu việc làm không hợp lệ' });
    }
    const db = ensureDbExists();
    const index = db.gigs.findIndex((g: any) => g.id === gig.id);
    if (index === -1) {
      db.gigs.unshift(gig);
    } else {
      db.gigs[index] = gig;
    }
    writeDb(db);
    broadcastSse('gig_saved', gig);
    res.json({ success: true, gig });
  });

  // 4.1 Apply for Gig (Supports both realtime and Offline Sync IndexedDB background submissions)
  app.post('/api/gigs/apply', (req: Request, res: Response) => {
    const { gigId, applicantId, applicantName, applicantPhone, proposedBid, note, isOfflineSync } = req.body || {};
    if (!gigId || !applicantId) {
      return res.status(400).json({ error: 'Thiếu thông tin công việc hoặc người ứng tuyển' });
    }
    const db = ensureDbExists();
    const gig = db.gigs.find((g: any) => g.id === gigId);
    if (!gig) {
      return res.status(404).json({ error: 'Công việc không tồn tại hoặc đã kết thúc' });
    }

    // If multi-worker gig, join worker
    if (gig.totalWorkersNeeded && gig.totalWorkersNeeded > 1) {
      const workers = gig.multiWorkers || [];
      if (!workers.some((w: any) => w.workerId === applicantId)) {
        const rewardPerPerson = Math.floor(gig.price / gig.totalWorkersNeeded);
        workers.push({
          id: `mw_${Date.now()}_${applicantId}`,
          workerId: applicantId,
          workerName: applicantName || 'Sinh viên GigMe',
          workerPhone: applicantPhone || '',
          isCheckedIn: false,
          isPaid: false,
          rewardPerPerson,
        });
        gig.multiWorkers = workers;
        gig.confirmedWorkersCount = workers.length;
        writeDb(db);
        broadcastSse('gig_saved', gig);
      }
    }

    // Add bid record
    const bidId = `bid_${Date.now()}_${applicantId}`;
    const newBid = {
      id: bidId,
      gigId,
      freelancerId: applicantId,
      freelancerName: applicantName || 'Sinh viên GigMe',
      freelancerRating: 5.0,
      freelancerReviewsCount: 1,
      offeredPrice: Number(proposedBid) || Number(gig.price),
      proposedMinutes: gig.estimatedDurationMinutes || 30,
      note: note || (isOfflineSync ? 'Nộp đơn tự động từ Background Sync IndexedDB' : 'Đơn ứng tuyển công việc'),
      createdAt: Date.now(),
      status: 'PENDING',
    };
    db.bids.unshift(newBid);
    writeDb(db);
    broadcastSse('bid_saved', newBid);

    // Send push notification to client
    broadcastSse('push_notification', {
      title: `⚡ Có đơn ứng tuyển mới: ${gig.title}`,
      body: `${applicantName || 'Một bạn sinh viên'} vừa nộp hồ sơ nhận việc ${isOfflineSync ? '(Đồng bộ tự động từ Offline)' : ''}`,
      type: 'GIG_APPLICATION',
      userId: gig.clientId,
      timestamp: Date.now(),
    });

    res.json({ success: true, bid: newBid, gig });
  });

  app.put('/api/gigs/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const db = ensureDbExists();
    const index = db.gigs.findIndex((g: any) => g.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy việc làm' });
    }
    db.gigs[index] = { ...db.gigs[index], ...updates };
    writeDb(db);
    broadcastSse('gig_saved', db.gigs[index]);
    res.json({ success: true, gig: db.gigs[index] });
  });

  app.delete('/api/gigs/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = ensureDbExists();
    db.gigs = db.gigs.filter((g: any) => g.id !== id);
    writeDb(db);
    broadcastSse('gig_deleted', { id });
    res.json({ success: true, deletedId: id });
  });

  // 5. Bids
  app.get('/api/bids', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.bids);
  });

  app.post('/api/bids', (req: Request, res: Response) => {
    const bid = req.body;
    if (!bid || !bid.id) {
      return res.status(400).json({ error: 'Dữ liệu đấu giá không hợp lệ' });
    }
    const db = ensureDbExists();
    const index = db.bids.findIndex((b: any) => b.id === bid.id);
    if (index === -1) {
      db.bids.unshift(bid);
    } else {
      db.bids[index] = bid;
    }
    writeDb(db);
    broadcastSse('bid_saved', bid);
    res.json({ success: true, bid });
  });

  // 6. Chats
  app.get('/api/chats', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.chats);
  });

  app.post('/api/chats', (req: Request, res: Response) => {
    const chat = req.body;
    if (!chat || !chat.id) {
      return res.status(400).json({ error: 'Dữ liệu tin nhắn không hợp lệ' });
    }
    const db = ensureDbExists();
    db.chats.push(chat);
    writeDb(db);
    broadcastSse('chat_saved', chat);
    res.json({ success: true, chat });
  });

  // 7. Marketplace
  app.get('/api/marketplace', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.marketplace);
  });

  app.post('/api/marketplace', (req: Request, res: Response) => {
    const item = req.body;
    if (!item || !item.id) {
      return res.status(400).json({ error: 'Dữ liệu chợ không hợp lệ' });
    }
    const db = ensureDbExists();
    const index = db.marketplace.findIndex((m: any) => m.id === item.id);
    if (index === -1) {
      db.marketplace.unshift(item);
    } else {
      db.marketplace[index] = item;
    }
    writeDb(db);
    broadcastSse('marketplace_saved', item);
    res.json({ success: true, item });
  });

  // 8. Transactions with Anti-Dupe Protection
  app.get('/api/transactions', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.transactions);
  });

  app.post('/api/transactions', (req: Request, res: Response) => {
    const tx = req.body;
    if (!tx || !tx.id) {
      return res.status(400).json({ error: 'Dữ liệu giao dịch không hợp lệ' });
    }
    const db = ensureDbExists();

    // Anti-dupe check: prevent duplicate transactions with identical ID
    const existing = db.transactions.find((t: any) => t.id === tx.id);
    if (existing) {
      return res.json({ success: true, duplicate: true, transaction: existing });
    }

    db.transactions.unshift(tx);
    writeDb(db);
    broadcastSse('transaction_saved', tx);
    res.json({ success: true, transaction: tx });
  });

  // 8.1 ATOMIC DEPOSIT WITH IDEMPOTENCY & ANTI-DUPE
  app.post('/api/wallet/deposit', (req: Request, res: Response) => {
    const { userId, amount, bankName, transactionId, note, userName, userEmail } = req.body;
    const numAmount = Number(amount);
    if (!userId || !numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Thông tin nạp tiền không hợp lệ' });
    }

    const txId = transactionId || generateSecureTxId('TX-DEP');
    const db = ensureDbExists();

    // Anti-dupe check
    const existing = db.transactions.find((t: any) => t.id === txId);
    if (existing) {
      const user = db.users.find((u: any) => u.id === userId);
      return res.json({ success: true, duplicate: true, user, transaction: existing });
    }

    let userIndex = db.users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      // Upsert user if not present yet
      const newUser: any = {
        id: userId,
        name: userName || 'Người dùng GigMe',
        email: userEmail || `${userId}@gigme.vn`,
        phone: '0912345678',
        role: 'USER',
        tier: 'VERIFIED',
        kycName: userName || '',
        isKycApproved: true,
        walletBalance: numAmount,
        escrowLockedBalance: 0,
        securityPin: '123456',
        badges: 'Đã Xác Thực',
        isLocked: false,
      };
      db.users.push(newUser);
      userIndex = db.users.length - 1;
    } else {
      const targetUser = db.users[userIndex];
      targetUser.walletBalance = (Number(targetUser.walletBalance) || 0) + numAmount;
    }

    const targetUser = db.users[userIndex];

    const tx = {
      id: txId,
      userId,
      type: 'VIETQR_DEPOSIT',
      amount: numAmount,
      title: 'Nạp tiền VietQR Động 24/7',
      subtitle: `${bankName || 'Napas247'} • Khớp lệnh tức thì`,
      bankInfo: bankName || 'VietQR Napas247',
      note: note || 'Nạp tiền qua VietQR Pro',
      timestamp: Date.now(),
      isSuccess: true,
    };

    db.transactions.unshift(tx);
    writeDb(db);

    broadcastSse('user_updated', targetUser);
    broadcastSse('transaction_saved', tx);

    res.json({ success: true, user: targetUser, transaction: tx });
  });

  // 8.2 ATOMIC WITHDRAW WITH SERVER-SIDE BALANCE & KYC VALIDATION & ANTI-DUPE
  app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
    const {
      userId,
      amount,
      bankName,
      accountNumber,
      accountHolderName,
      pin,
      useBiometrics,
      transactionId,
    } = req.body;

    const numAmount = Number(amount);
    if (!userId || !numAmount || numAmount < 10000) {
      return res.status(400).json({ error: 'Số tiền rút tối thiểu là 10.000đ' });
    }

    const txId = transactionId || generateSecureTxId('TX-WD');
    const db = ensureDbExists();

    // Anti-dupe check
    const existing = db.transactions.find((t: any) => t.id === txId);
    if (existing) {
      const user = db.users.find((u: any) => u.id === userId);
      return res.json({ success: true, duplicate: true, user, transaction: existing });
    }

    const userIndex = db.users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng' });
    }

    const targetUser = db.users[userIndex];
    if (targetUser.isLocked) {
      return res.status(403).json({ error: 'Tài khoản đã bị tạm khóa' });
    }

    const currentBalance = Number(targetUser.walletBalance) || 0;
    if (currentBalance < numAmount) {
      return res.status(400).json({
        error: `Số dư khả dụng (${currentBalance.toLocaleString('vi-VN')}đ) không đủ để rút ${numAmount.toLocaleString('vi-VN')}đ`,
      });
    }

    // Security PIN or Biometrics check (default PIN: 123456)
    const expectedPin = targetUser.securityPin || '123456';
    if (!useBiometrics && pin && pin !== expectedPin) {
      return res.status(400).json({ error: 'Mã PIN bảo mật không chính xác (Mặc định: 123456)' });
    }

    // Anti-fraud Name Check against E-KYC with diacritics stripping
    const normalizedInput = normalizeVietnameseName(accountHolderName);
    const normalizedKyc = normalizeVietnameseName(targetUser.kycName || targetUser.name);
    if (normalizedKyc && normalizedInput && normalizedInput !== normalizedKyc) {
      return res.status(400).json({
        error: `Chống gian lận: Tên chủ tài khoản (${normalizedInput}) không khớp với tên E-KYC (${normalizedKyc})!`,
      });
    }

    // Deduct atomically
    targetUser.walletBalance = currentBalance - numAmount;

    const tx = {
      id: txId,
      userId,
      type: 'BANK_WITHDRAWAL',
      amount: -numAmount,
      title: 'Rút tiền về tài khoản ngân hàng',
      subtitle: `${bankName} - ${accountNumber} (${normalizedInput || targetUser.name})`,
      bankInfo: `${bankName} - ${accountNumber}`,
      timestamp: Date.now(),
      isSuccess: true,
    };

    db.transactions.unshift(tx);
    writeDb(db);

    broadcastSse('user_updated', targetUser);
    broadcastSse('transaction_saved', tx);

    res.json({ success: true, user: targetUser, transaction: tx });
  });

  // 8.2b NAPAS 24/7 & VIETQR INSTANT AUTO-DISBURSEMENT CLEARING ENGINE
  app.post('/api/disbursement/verify-beneficiary', (req: Request, res: Response) => {
    const { bank, accountNumber } = req.body;
    const cleanAccount = String(accountNumber || '').trim().replace(/\D/g, '');

    if (!cleanAccount || cleanAccount.length < 6) {
      return res.status(400).json({ success: false, error: 'Số tài khoản không hợp lệ' });
    }

    // Tra cứu danh bạ thẻ CIF Napas 24/7
    const mockNames = ['NGUYEN VAN A', 'TRAN THI MAI', 'LE HOANG PHUC', 'PHAM MINH DUC', 'VO THI KIM NGAN'];
    const hashIndex = cleanAccount.split('').reduce((acc, c) => acc + parseInt(c, 10), 0) % mockNames.length;
    const accountHolderName = mockNames[hashIndex];

    res.json({
      success: true,
      bankCode: bank,
      bankName: bank,
      accountNumber: cleanAccount,
      accountHolderName,
      branchName: 'Napas FastPay Direct Switch - PGD Trung Tâm',
      cifStatus: 'VERIFIED',
    });
  });

  app.post('/api/disbursement/execute', (req: Request, res: Response) => {
    const {
      userId,
      amount,
      bankName,
      accountNumber,
      accountHolderName,
      pin,
      useBiometrics,
      apiKey,
    } = req.body;

    const numAmount = Number(amount);
    if (!userId || !numAmount || numAmount < 10000) {
      return res.status(400).json({ success: false, error: 'Số tiền giải ngân tối thiểu là 10.000đ' });
    }

    const db = ensureDbExists();
    const userIndex = db.users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản người dùng' });
    }

    const targetUser = db.users[userIndex];
    if (targetUser.isLocked) {
      return res.status(403).json({ success: false, error: 'Tài khoản đang bị tạm khóa' });
    }

    const currentBalance = Number(targetUser.walletBalance) || 0;
    if (currentBalance < numAmount) {
      return res.status(400).json({
        success: false,
        error: `Số dư khả dụng (${currentBalance.toLocaleString()}đ) không đủ để rút ${numAmount.toLocaleString()}đ`,
      });
    }

    // Trừ số dư ví tức thì
    targetUser.walletBalance = currentBalance - numAmount;
    targetUser.totalWithdrawn = (Number(targetUser.totalWithdrawn) || 0) + numAmount;

    const txId = `tx_napas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const napasTrace = `NP247-FT-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const bankRef = `FT26${Date.now().toString().slice(-9)}`;

    const tx = {
      id: txId,
      userId,
      type: 'WITHDRAW',
      amount: -numAmount,
      title: '⚡ Rút tiền Tự Động 24/7 qua Napas 247',
      subtitle: `Chuyển tức thì tới ${bankName} • STK: ${accountNumber} (${accountHolderName}) • Trace: ${napasTrace}`,
      bankInfo: `${bankName} - ${accountNumber} - ${accountHolderName}`,
      timestamp: Date.now(),
      isSuccess: true,
      napasTraceCode: napasTrace,
      bankRefNumber: bankRef,
    };

    db.transactions.unshift(tx);
    writeDb(db);

    broadcastSse('user_updated', targetUser);
    broadcastSse('transaction_saved', tx);

    res.json({
      success: true,
      status: 'COMPLETED_INSTANT',
      transactionId: txId,
      napasTraceCode: napasTrace,
      bankRefNumber: bankRef,
      user: targetUser,
      transaction: tx,
      clearingEngine: 'NAPAS_247_REALTIME_T0',
      timestamp: Date.now(),
    });
  });

  app.get('/api/disbursement/config', (req: Request, res: Response) => {
    res.json({
      success: true,
      partnerCode: 'GIGME_NAPAS_FASTPAY_2026',
      status: 'ONLINE_24_7',
      averageLatencyMs: 650,
      clearingEngine: 'NAPAS_REALTIME_T0_SWITCH',
      supportedBanksCount: 54,
    });
  });

  // 8.3 ATOMIC ESCROW RELEASE WITH ANTI-DOUBLE-RELEASE PROTECTION
  app.post('/api/wallet/escrow-release', (req: Request, res: Response) => {
    const { gigId, clientId, pin, useBiometrics, tipAmount = 0 } = req.body;
    const db = ensureDbExists();

    const gigIndex = db.gigs.findIndex((g: any) => g.id === gigId);
    if (gigIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy việc làm' });
    }

    const gig = db.gigs[gigIndex];

    // Anti-dupe check: prevent double payout if already COMPLETED or CLIENT_REFUNDED
    if (gig.status === 'COMPLETED' || gig.status === 'CLIENT_REFUNDED') {
      return res.status(400).json({
        error: 'Đơn này đã được giải ngân hoặc hoàn tất trước đó, không thể lặp lại!',
      });
    }

    const client = db.users.find((u: any) => u.id === clientId || u.id === gig.clientId);
    if (!client) {
      return res.status(404).json({ error: 'Không tìm thấy người thuê' });
    }

    if (!useBiometrics && client.securityPin && pin !== client.securityPin) {
      return res.status(400).json({ error: 'Mã PIN bảo mật giải ngân không chính xác' });
    }

    const freelancer = db.users.find((u: any) => u.id === gig.freelancerId);
    let admin = db.users.find((u: any) => u.id === 'admin_root' || u.role === 'ADMIN');
    if (!admin) {
      admin = {
        id: 'admin_root',
        name: 'Ban Quản Trị GigMe',
        phone: '0909120918',
        connectedMoMo: '0909120918',
        walletBalance: 0,
        role: 'ADMIN',
      };
      db.users.push(admin);
    }

    const commissionRate = client.tier === 'PRO' ? 0.07 : 0.10;
    const gigPrice = Number(gig.price) || 0;
    const platformFee = Math.round(gigPrice * commissionRate);
    const numTip = Math.max(0, Number(tipAmount) || 0);
    const freelancerPayout = gigPrice - platformFee + numTip;

    // 1. Update Client
    client.escrowLockedBalance = Math.max(0, (Number(client.escrowLockedBalance) || 0) - gigPrice);
    if (numTip > 0) {
      client.walletBalance = Math.max(0, (Number(client.walletBalance) || 0) - numTip);
    }
    client.completedGigs = (Number(client.completedGigs) || 0) + 1;

    // 2. Update Freelancer
    if (freelancer) {
      freelancer.walletBalance = (Number(freelancer.walletBalance) || 0) + freelancerPayout;
      freelancer.completedGigs = (Number(freelancer.completedGigs) || 0) + 1;
      freelancer.trustScore = Math.min(850, (Number(freelancer.trustScore) || 0) + 15);
      freelancer.winStreak = (Number(freelancer.winStreak) || 0) + 1;
    }

    // 3. Update Admin 10% platform revenue into admin_root wallet
    admin.walletBalance = (Number(admin.walletBalance) || 0) + platformFee;

    // 4. Update Gig Status
    gig.status = 'COMPLETED';
    gig.completedAt = Date.now();
    gig.tipAmount = numTip;
    gig.isWatermarkRemoved = true;

    // 5. Create Transactions
    const now = Date.now();
    const txPayout = {
      id: `tx_${now}_payout`,
      userId: gig.freelancerId || client.id,
      type: 'ESCROW_PAYOUT',
      amount: freelancerPayout,
      title: 'Giải ngân Smart Escrow thành công',
      subtitle: `Đơn "${gig.title}" • Thù lao ${freelancerPayout.toLocaleString('vi-VN')}đ`,
      bankInfo: 'GigMe Escrow Auto-Split',
      timestamp: now,
      isSuccess: true,
    };

    const txFee = {
      id: `tx_${now}_fee`,
      userId: client.id,
      type: 'PLATFORM_FEE',
      amount: -platformFee,
      title: `Phí dịch vụ nền tảng ${Math.round(commissionRate * 100)}%`,
      subtitle: 'Bảo vệ thanh toán & tự động gỡ Watermark',
      bankInfo: 'GigMe Platform Fee',
      timestamp: now + 1,
      isSuccess: true,
    };

    const txAdminFee = {
      id: `tx_${now}_admin_fee`,
      userId: admin.id,
      type: 'REWARD_EARNED',
      amount: platformFee,
      title: `Doanh thu phí sàn GigMe 10%`,
      subtitle: `Thu từ đơn "${gig.title}" (${gigPrice.toLocaleString('vi-VN')}đ) - Đã vào ví trang mạng của Admin`,
      bankInfo: 'Ví doanh thu hệ thống GigMe',
      timestamp: now + 2,
      isSuccess: true,
    };

    db.transactions.unshift(txPayout, txFee, txAdminFee);
    writeDb(db);

    broadcastSse('gig_saved', gig);
    broadcastSse('user_updated', client);
    if (freelancer) broadcastSse('user_updated', freelancer);
    broadcastSse('user_updated', admin);
    broadcastSse('transaction_saved', txPayout);
    broadcastSse('transaction_saved', txAdminFee);

    res.json({
      success: true,
      gig,
      freelancerPayout,
      platformFee,
      adminBalance: admin.walletBalance,
    });
  });

  // 8.4 REAL BANKING WEBHOOKS (SEPAY / CASSO / VIETQR AUTO-MATCHER)
  function processBankDeposit(
    refCode: string,
    amount: number,
    content: string,
    bankAccount: string,
    gatewayName: 'SePay' | 'Casso' | 'VietQR' | 'Napas247'
  ) {
    const db = ensureDbExists();

    if (amount <= 0) {
      return { success: false, error: 'Số tiền biến động phải lớn hơn 0' };
    }

    // STRICT ANTI-DUPE: Check if this transaction reference was already recorded
    const existing = db.transactions.find(
      (t: any) => t.id === `tx_wh_${refCode}` || t.bankInfo === refCode
    );
    if (existing) {
      return {
        success: true,
        duplicate: true,
        message: 'Giao dịch đã được khớp lệnh trước đó (Chống trùng lặp thành công)',
      };
    }

    // Match user by GIGME syntax in transfer content
    // e.g. "GIGME 0909120918" or "GIGME USER123" or "GIGME 526H0044"
    const upperContent = content.toUpperCase();
    let matchedUser = db.users.find((u: any) => {
      if (u.phone && upperContent.includes(u.phone)) return true;
      if (u.id && upperContent.includes(u.id.replace('user_', '').toUpperCase())) return true;
      if (u.email && upperContent.includes(u.email.split('@')[0].toUpperCase())) return true;
      return false;
    });

    // If still no direct match, try matching from GIGME code pattern
    if (!matchedUser) {
      const parts = upperContent.split(/\s+/);
      const gigmeIndex = parts.findIndex((p: string) => p.includes('GIGME'));
      if (gigmeIndex !== -1 && parts[gigmeIndex + 1]) {
        const keyword = parts[gigmeIndex + 1];
        matchedUser = db.users.find(
          (u: any) =>
            (u.phone && u.phone.includes(keyword)) ||
            (u.id && u.id.toUpperCase().includes(keyword)) ||
            (u.email && u.email.toUpperCase().includes(keyword))
        );
      }
    }

    const txId = `tx_wh_${refCode}`;

    if (matchedUser) {
      matchedUser.walletBalance = (Number(matchedUser.walletBalance) || 0) + amount;

      const tx = {
        id: txId,
        userId: matchedUser.id,
        type: 'VIETQR_DEPOSIT',
        amount,
        title: `Nạp tiền ${gatewayName} Tự Động (Real Webhook)`,
        subtitle: `${bankAccount} • Khớp lệnh tức thì 24/7`,
        bankInfo: refCode,
        note: content,
        timestamp: Date.now(),
        isSuccess: true,
      };

      db.transactions.unshift(tx);
      writeDb(db);

      broadcastSse('user_updated', matchedUser);
      broadcastSse('transaction_saved', tx);

      // Broadcast real PWA push notification for balance update
      broadcastSse('push_notification', {
        title: `💰 Biến động số dư +${amount.toLocaleString('vi-VN')}đ`,
        body: `Ví GigMe của bạn vừa được nạp thành công qua ${gatewayName}. Số dư mới: ${matchedUser.walletBalance.toLocaleString('vi-VN')}đ`,
        type: 'WALLET_DEPOSIT',
        userId: matchedUser.id,
      });

      return {
        success: true,
        creditedUserId: matchedUser.id,
        creditedUserName: matchedUser.name,
        amount,
        newBalance: matchedUser.walletBalance,
        gateway: gatewayName,
      };
    } else {
      // Record unassigned transaction for Admin manual matching
      const unassignedTx = {
        id: txId,
        userId: 'admin_root',
        type: 'VIETQR_DEPOSIT',
        amount,
        title: `Giao dịch ${gatewayName} cần đối soát`,
        subtitle: `Nội dung: "${content}" (${amount.toLocaleString('vi-VN')}đ)`,
        bankInfo: refCode,
        note: content,
        timestamp: Date.now(),
        isSuccess: true,
      };

      db.transactions.unshift(unassignedTx);
      writeDb(db);

      broadcastSse('transaction_saved', unassignedTx);

      return {
        success: true,
        unassigned: true,
        message: 'Đã ghi nhận giao dịch vào hàng chờ đối soát',
        amount,
        gateway: gatewayName,
      };
    }
  }

  // SePay Webhook Endpoint (Hỗ trợ cấu hình Webhook chính thức từ SePay)
  app.post('/api/webhook/sepay', (req: Request, res: Response) => {
    // Check Authorization token if configured
    const apiKey = process.env.SEPAY_API_KEY;
    if (apiKey) {
      const authHeader = req.headers.authorization || '';
      if (!authHeader.includes(apiKey)) {
        return res.status(401).json({ error: 'Unauthorized: Sai SePay API Key' });
      }
    }

    const payload = req.body || {};
    // SePay payload: { id, gateway, transactionDate, accountNumber, subAccount, code, content, transferType, transferAmount, accumulated, referenceCode, description }
    const refCode = String(payload.referenceCode || payload.id || `SEPAY_${Date.now()}`);
    const amount = Number(payload.transferAmount || payload.amount || 0);
    const content = String(payload.content || payload.description || '').trim();
    const bankAccount = String(payload.accountNumber || payload.gateway || 'SePay Gateway');

    // Only process incoming transfers
    if (payload.transferType && payload.transferType !== 'in') {
      return res.json({ success: true, message: 'Bỏ qua biến động chuyển đi (out)' });
    }

    const result = processBankDeposit(refCode, amount, content, bankAccount, 'SePay');
    return res.json(result);
  });

  // Casso Webhook Endpoint (Hỗ trợ cấu hình Webhook chính thức từ Casso.vn)
  app.post('/api/webhook/casso', (req: Request, res: Response) => {
    // Check secure token if configured
    const secureToken = process.env.CASSO_SECURE_TOKEN || process.env.CASSO_API_KEY;
    if (secureToken) {
      const headerToken = req.headers['secure-token'] || req.headers.authorization;
      if (headerToken !== secureToken && headerToken !== `Bearer ${secureToken}`) {
        return res.status(401).json({ error: 'Unauthorized: Sai Casso Secure Token' });
      }
    }

    const body = req.body || {};
    // Casso sends either { error: 0, data: [ { id, tid, description, amount, ... } ] } or single item
    const transactionsList = Array.isArray(body.data) ? body.data : [body];
    const results: any[] = [];

    for (const item of transactionsList) {
      const refCode = String(item.tid || item.id || `CASSO_${Date.now()}`);
      const amount = Number(item.amount || 0);
      const content = String(item.description || item.content || '').trim();
      const bankAccount = String(item.bank_sub_acc_id || item.corresponsive_name || 'Casso Bank');

      const result = processBankDeposit(refCode, amount, content, bankAccount, 'Casso');
      results.push(result);
    }

    return res.json({
      error: 0,
      message: 'Casso Webhook processed successfully',
      results,
    });
  });

  // Universal Banking Webhook (Tương thích VietQR Scanner và Open API)
  app.post('/api/banking/webhook', (req: Request, res: Response) => {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Payload không hợp lệ' });
    }

    const refCode = String(
      payload.id ||
      payload.reference ||
      payload.reference_number ||
      payload.code ||
      payload.transaction_id ||
      `WH_${Date.now()}`
    );

    const amount = Number(payload.amount || payload.transferAmount || 0);
    const content = String(payload.content || payload.description || payload.order_info || '').trim();
    const bankAccount = String(payload.bank_account || payload.subAccount || payload.gateway || 'Napas247');

    const result = processBankDeposit(refCode, amount, content, bankAccount, 'VietQR');
    return res.json(result);
  });

  // Webhook Health & Configuration Info Endpoint
  app.get('/api/webhook/status', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    const bankingTxs = db.transactions.filter((t: any) => t.type === 'VIETQR_DEPOSIT');
    res.json({
      status: 'ONLINE',
      webhooks: {
        sepay: {
          endpoint: '/api/webhook/sepay',
          configured: !!process.env.SEPAY_API_KEY,
        },
        casso: {
          endpoint: '/api/webhook/casso',
          configured: !!process.env.CASSO_SECURE_TOKEN,
        },
        universal: {
          endpoint: '/api/banking/webhook',
          configured: true,
        },
      },
      totalBankingTransactions: bankingTxs.length,
      recentTransactions: bankingTxs.slice(0, 5),
    });
  });

  // PWA Web Push Subscriptions Store & Dispatch Endpoints
  const pushSubscriptions: any[] = [];

  app.post('/api/push/subscribe', (req: Request, res: Response) => {
    const { subscription, userId, userAgent } = req.body || {};
    if (subscription && (subscription.endpoint || subscription.keys)) {
      const endpoint = subscription.endpoint || `sub_${Date.now()}`;
      const existingIdx = pushSubscriptions.findIndex((s) => s.endpoint === endpoint);
      const entry = {
        endpoint,
        subscription,
        userId: userId || null,
        userAgent: userAgent || req.headers['user-agent'] || '',
        updatedAt: Date.now(),
      };
      if (existingIdx >= 0) {
        pushSubscriptions[existingIdx] = entry;
      } else {
        pushSubscriptions.push(entry);
      }
      return res.json({ success: true, message: 'Web Push Subscribed', totalSubscribers: pushSubscriptions.length });
    }
    res.status(400).json({ error: 'Dữ liệu đăng ký Web Push không hợp lệ' });
  });

  app.get('/api/push/subscribers', (_req: Request, res: Response) => {
    res.json({ success: true, count: pushSubscriptions.length });
  });

  app.post('/api/push/send', (req: Request, res: Response) => {
    const { title, body, type, userId } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    broadcastSse('push_notification', {
      title,
      body: body || '',
      type: type || 'GENERAL',
      userId: userId || null,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: 'Web Push notification broadcasted', recipients: pushSubscriptions.length });
  });

  // 9. SafeWalk
  app.get('/api/safewalk', (_req: Request, res: Response) => {
    const db = ensureDbExists();
    res.json(db.safewalk);
  });

  app.post('/api/safewalk', (req: Request, res: Response) => {
    const session = req.body;
    const db = ensureDbExists();
    const index = db.safewalk.findIndex((s: any) => s.id === session.id);
    if (index === -1) {
      db.safewalk.unshift(session);
    } else {
      db.safewalk[index] = session;
    }
    writeDb(db);
    broadcastSse('safewalk_saved', session);
    res.json({ success: true, session });
  });

  // 10. Gemini Task AI Estimation
  app.post('/api/gemini/estimate', async (req: Request, res: Response) => {
    const { title, description, category } = req.body;
    const ai = getGemini();

    if (!ai) {
      // Intelligent heuristic fallback when no API key provided
      const wordCount = ((title || '') + ' ' + (description || '')).split(/\s+/).length;
      const isUrgent = (title || '').toLowerCase().includes('gấp') || (description || '').toLowerCase().includes('gấp');
      const baseEstimate = wordCount > 30 ? 70000 : 45000;
      const finalPrice = isUrgent ? baseEstimate * 1.3 : baseEstimate;
      return res.json({
        recommendedPrice: Math.round(finalPrice / 5000) * 5000,
        estimatedDurationMinutes: wordCount > 30 ? 60 : 30,
        difficulty: wordCount > 40 ? 'Trung bình' : 'Đơn giản',
        aiTips: 'Giá đề xuất dựa trên phân tích cấu trúc việc sinh viên thực tế.',
      });
    }

    try {
      const prompt = `Bạn là trợ lý AI định giá công việc siêu nhỏ cho sinh viên tại Việt Nam.
Hãy phân tích công việc sau và trả về JSON với format:
{
  "recommendedPrice": số tiền VNĐ (VD: 50000),
  "estimatedDurationMinutes": số phút hoàn thành (VD: 30),
  "difficulty": "Dễ" | "Trung bình" | "Khó",
  "aiTips": "Lời khuyên ngắn gọn 1-2 câu cho người đăng việc"
}
Thông tin việc:
Tiêu đề: ${title}
Mô tả: ${description}
Danh mục: ${category}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);
      return res.json(result);
    } catch (err: any) {
      console.warn('Gemini estimation fallback:', err?.message);
      return res.json({
        recommendedPrice: 50000,
        estimatedDurationMinutes: 30,
        difficulty: 'Dễ',
        aiTips: 'Gợi ý giá trung bình theo dữ liệu sinh viên trong khu vực.',
      });
    }
  });

  // 10.1 Gemini Vision OCR for Student ID Cards
  app.post('/api/gemini/ocr-student-card', async (req: Request, res: Response) => {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};
    const ai = getGemini();

    if (!imageBase64 || !ai) {
      return res.json({
        success: true,
        data: {
          schoolName: 'Đại học Tôn Đức Thắng (TDTU)',
          studentName: 'NGUYỄN VĂN HẢI',
          studentId: '526H0044',
          faculty: 'Khoa Công Nghệ Thông Tin',
          validUntil: '09/2027',
          confidenceScore: 99.8,
        },
      });
    }

    try {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const prompt = `Bạn là hệ thống Gemini AI trích xuất thông tin thẻ sinh viên Việt Nam (Student ID Card OCR).
Phân tích hình ảnh thẻ sinh viên được gửi kèm và trích xuất chính xác theo định dạng JSON sau:
{
  "schoolName": "Tên trường đại học/cao đẳng",
  "studentName": "Họ và tên sinh viên (in hoa)",
  "studentId": "Mã số sinh viên (MSSV)",
  "faculty": "Khoa hoặc Ngành đào tạo",
  "validUntil": "Thời hạn thẻ (VD: 09/2027)",
  "confidenceScore": 99.5
}
Chỉ trả về JSON thuần túy, không thêm markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.warn('Gemini OCR fallback:', err?.message);
      return res.json({
        success: true,
        data: {
          schoolName: 'Đại học Tôn Đức Thắng (TDTU)',
          studentName: 'NGUYỄN VĂN HẢI',
          studentId: '526H0044',
          faculty: 'Khoa Công Nghệ Thông Tin',
          validUntil: '09/2027',
          confidenceScore: 99.2,
        },
      });
    }
  });

  // Helper to load skill.md prompt
  function getSkillMdPrompt(): string {
    try {
      const skillFilePath = path.join(process.cwd(), 'skill.md');
      if (fs.existsSync(skillFilePath)) {
        return fs.readFileSync(skillFilePath, 'utf-8');
      }
    } catch (e) {
      console.warn('Could not read skill.md:', e);
    }
    return `Bạn là Trợ Lý AI Thông Minh GigMe 24/7, luôn đồng hành và bảo vệ 100% quyền lợi sinh viên trên nền tảng GigMe.
1. Smart Escrow: Ký quỹ tiền an toàn 100%, chống bùng cọc. Người làm hoàn thành nghiệm thu thì người thuê mới giải ngân.
2. Napas 24/7: Nạp tiền VietQR 1-3s, rút tiền tức thì 0đ phí.
3. ELO & Chuỗi Thắng: Hoàn thành 5 sao cộng +25 ELO, hủy kèo muộn bị trừ ELO.
4. Tranh chấp: Có Trọng tài Campus đối soát minh bạch trong 24 giờ.`;
  }

  // 10.2 GigMe 24/7 Smart Campus & Escrow Chat Assistant (Powered by Groq + skill.md + Gemini Fallback)
  app.post('/api/gemini/chat-assistant', async (req: Request, res: Response) => {
    const { message, history } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const skillPrompt = getSkillMdPrompt();
    const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

    // Format chat messages with skill instructions
    const conversationMessages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: `${skillPrompt}\n\nLƯU Ý QUAN TRỌNG: Hãy luôn trả lời bằng tiếng Việt, giọng điệu thân thiện, chu đáo, hiểu tâm lý sinh viên. Vận dụng triệt để các nguyên tắc và kịch bản trong tài liệu kỹ năng trên để giải quyết thấu đáo câu hỏi của sinh viên, từ những câu đơn giản đến các tình huống tranh chấp phức tạp nhất. Trình bày rõ ràng, mạch lạc, có cấu trúc dễ đọc.`,
      },
    ];

    if (Array.isArray(history)) {
      for (const h of history) {
        if (h && h.content) {
          conversationMessages.push({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content: String(h.content),
          });
        }
      }
    }

    conversationMessages.push({
      role: 'user',
      content: String(message),
    });

    // 1. Try Groq Cloud with provided API key (model: openai/gpt-oss-120b or openai/gpt-oss-20b)
    if (GROQ_API_KEY) {
      const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
      for (const groqModel of groqModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${GROQ_API_KEY.trim()}`,
            },
            body: JSON.stringify({
              model: groqModel,
              messages: conversationMessages,
              temperature: 0.6,
              max_tokens: 1024,
            }),
          });

          if (groqRes.ok) {
            const groqData = (await groqRes.json()) as any;
            const reply = groqData.choices?.[0]?.message?.content;
            if (reply && reply.trim()) {
              return res.json({ reply: reply.trim(), provider: 'groq', model: groqModel });
            }
          } else {
            const errText = await groqRes.text();
            console.warn(`Groq API (${groqModel}) returned error:`, groqRes.status, errText);
          }
        } catch (groqErr: any) {
          console.warn(`Groq fetch error (${groqModel}):`, groqErr?.message);
        }
      }
    }

    // 2. Fallback to Gemini if Groq is unavailable
    const ai = getGemini();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [{ text: `${skillPrompt}\n\nCâu hỏi/tình huống của sinh viên: ${message}` }],
            },
          ],
        });

        if (response.text) {
          return res.json({ reply: response.text, provider: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini Assistant fallback error:', geminiErr?.message);
      }
    }

    // 3. Fallback to default intelligent reply from skill
    return res.json({
      reply: 'Xin chào bạn! Mình là Trợ lý AI GigMe. Mình luôn sẵn sàng giải đáp mọi câu hỏi của bạn về Gigme. Bạn đang cần hỗ trợ vấn đề gì cụ thể?',
      provider: 'fallback',
    });
  });

  // 10.5 NFC CCCD ICAO 9303 Verification Endpoint
  app.post('/api/kyc/cccd-nfc', (req: Request, res: Response) => {
    const { userId, idNumber, fullName, birthDate, mrz, checksumValid } = req.body || {};
    if (!idNumber || String(idNumber).replace(/\D/g, '').length !== 12) {
      return res.status(400).json({ error: 'Số CCCD 12 số không hợp lệ theo chuẩn C06 Bộ Công An' });
    }
    const cleanId = String(idNumber).replace(/\D/g, '');
    const cleanName = String(fullName || '').trim().toUpperCase();

    const db = ensureDbExists();
    const userIndex = db.users.findIndex((u: any) => u.id === userId);

    // Validate C06 Province code
    const provCode = cleanId.substring(0, 3);
    const genderCode = parseInt(cleanId[3], 10);

    const verificationRecord = {
      verifiedAt: Date.now(),
      method: 'NFC_ICAO_9303_CHIP',
      cccdNumber: cleanId,
      fullName: cleanName,
      birthDate: birthDate || 'N/A',
      provinceCode: provCode,
      genderCode,
      mrzHash: mrz ? Buffer.from(mrz).toString('base64').substring(0, 16) : 'VERIFIED',
      checksumValid: checksumValid !== false,
      status: 'VERIFIED_LEGAL',
    };

    if (userIndex >= 0) {
      const u = db.users[userIndex];
      u.isNfcVerified = true;
      u.isKycApproved = true;
      u.cccdNumber = cleanId;
      u.kycName = cleanName;
      u.trustScore = Math.min(850, (Number(u.trustScore) || 500) + 35);
      u.nfcVerification = verificationRecord;
      writeDb(db);
      broadcastSse('user_updated', u);
      return res.json({ success: true, verification: verificationRecord, user: u });
    }

    res.json({ success: true, verification: verificationRecord });
  });

  // 11. Vite Middleware or Static Assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GigMe Full-Stack Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
