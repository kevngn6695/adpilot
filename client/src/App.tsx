import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import DashboardPage from '@/pages/Dashboard';
import NotFoundPage from '@/pages/NotFound';

// The wizard isn't needed for the first paint, so it loads as its own chunk.
const NewCampaignPage = lazy(() => import('@/pages/NewCampaign'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route
          path="campaigns/new"
          element={
            <Suspense fallback={null}>
              <NewCampaignPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
