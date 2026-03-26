export const dynamic = 'force-dynamic';

import HeroCarousel from './components/HeroCarousel';
import StrugglingSection from './components/StrugglingSection';
import TrendingCourses from './components/TrendingCourses';
import ProductCards from './components/ProductCards';
import AchievementsSection from './components/AchievementsSection';

export default function Home() {
  return (
    <main className="bg-white">
      <HeroCarousel />
      <StrugglingSection />
      <TrendingCourses />
      <ProductCards />
      <AchievementsSection />
    </main>
  );
}