import { getDb } from '../utils/firebaseAdmin'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, s-maxage=30, stale-while-revalidate=120')
  const subject = String(getQuery(event).subject || 'toan')
  const db = getDb()

  const snap = await db
    .collection(`leaderboards/${subject}/entries`)
    .orderBy('rating', 'desc')
    .limit(50)
    .get()

  // Sample seed fallback for demo if leaderboard is empty
  if (snap.docs.length === 0) {
    const demoEntries = [
      { rank: 1, id: 'u1', displayName: 'Nguyễn Trần Quang', school: 'THPT Chuyên Hà Nội - Amsterdam', province: 'Hà Nội', rating: 1480 },
      { rank: 2, id: 'u2', displayName: 'Lê Hoàng Long', school: 'THPT Chuyên Lê Hồng Phong', province: 'TP. Hồ Chí Minh', rating: 1420 },
      { rank: 3, id: 'u3', displayName: 'Đỗ Thảo Vy', school: 'THPT Chuyên Lam Sơn', province: 'Thanh Hóa', rating: 1390 },
      { rank: 4, id: 'u4', displayName: 'Trịnh Quốc Bảo', school: 'THPT Chuyên Phan Bội Châu', province: 'Nghệ An', rating: 1350 },
      { rank: 5, id: 'u5', displayName: 'Phạm Tuấn Khôi', school: 'THPT Chuyên Quốc Học Huế', province: 'Thừa Thiên Huế', rating: 1310 },
      { rank: 6, id: 'u6', displayName: 'Nguyễn Văn A', school: 'THPT Chuyên Lê Quý Đôn', province: 'Đà Nẵng', rating: 1040 },
    ]
    return demoEntries
  }

  return snap.docs.map((d: any, index: number) => {
    const data = d.data()!
    return {
      rank: index + 1,
      id: d.id,
      displayName: data.displayName || 'Học sinh',
      school: data.school || 'THPT',
      province: data.province || 'Toàn quốc',
      rating: data.rating || 1000,
    }
  })
})

