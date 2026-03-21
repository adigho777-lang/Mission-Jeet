import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

// ✅ BASE FIX
const IS_SERVER = typeof window === 'undefined';

const BASE = IS_SERVER
  ? 'https://apiserverpro.onrender.com/api/missionjeet'
  : '/api/missionjeet';

// 🔥 MAIN FUNCTION
export async function syncCourseFull(courseId) {
  try {
    // 1. COURSE DETAILS
    const res = await fetch(`${BASE}/course-details?courseid=${courseId}`);
    const json = await res.json();

    const overview = json?.data?.find(d => d.type === 'overview');
    const details = overview?.data?.find(d => d.layout_type === 'details')?.layout_data?.[0];

    // 2. CONTENT
    const contentRes = await fetch(`${BASE}/all-content/${courseId}`);
    const contentJson = await contentRes.json();

    let content = contentJson?.data || [];

    // 3. VIDEO URL FETCH
    const finalContent = await Promise.all(
      content.map(async (item) => {
        if (item.type === 'file') {
          try {
            const videoRes = await fetch(
              `${BASE}/content-details?content_id=${item.id}&course_id=${courseId}`
            );
            const videoJson = await videoRes.json();

            return {
              ...item,
              videoUrl: videoJson?.file_url || null
            };
          } catch {
            return { ...item, videoUrl: null };
          }
        }
        return item;
      })
    );

    // 4. SAVE FIREBASE
    await setDoc(doc(db, 'courses', String(courseId)), {
      id: courseId,
      title: details?.title || '',
      description: details?.description || '',
      thumbnail: details?.thumbnail || '',
      mrp: details?.mrp || '',
      offer_price: details?.offer_price || '',
      content: finalContent,
      updatedAt: new Date()
    });

    console.log("✅ Saved with videos");

  } catch (err) {
    console.error("❌ Sync Error:", err);
  }
}