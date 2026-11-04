import { Route, Routes } from 'react-router-dom';

import { SiteLayout } from './components/layout/SiteLayout.jsx';
import { AdminShell, ProtectedAdmin } from './components/admin/AdminShell.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { MbbsLibraryPage } from './pages/MbbsLibraryPage.jsx';
import { MdcatResLibraryPage } from './pages/MdcatResLibraryPage.jsx';
import { LibraryTopicPage } from './pages/LibraryTopicPage.jsx';
import { BlogPostPage } from './pages/BlogPostPage.jsx';
import { MdcatPage } from './pages/MdcatPage.jsx';
import { PracticePage } from './pages/PracticePage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { SubscribeConfirmedPage } from './pages/SubscribeConfirmedPage.jsx';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.jsx';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage.jsx';

import { MessagesSection } from './components/admin/MessagesSection.jsx';
import { SubscribersSection } from './components/admin/SubscribersSection.jsx';
import { MdcatConfigSection } from './components/admin/MdcatConfigSection.jsx';
import { LibrarySection } from './components/admin/LibrarySection.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/mbbs" element={<MbbsLibraryPage />} />
        <Route path="/mbbs/topic/:slug" element={<LibraryTopicPage />} />
        <Route path="/mbbs/post/:id" element={<BlogPostPage />} />
        <Route path="/mdcat-res" element={<MdcatResLibraryPage />} />
        <Route path="/mdcat-res/topic/:slug" element={<LibraryTopicPage section="mdcat" />} />
        <Route path="/mdcat-res/post/:id" element={<BlogPostPage section="mdcat" />} />
        <Route path="/mdcat" element={<MdcatPage />} />
        <Route path="/mdcat/practice" element={<PracticePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/subscribe/confirmed" element={<SubscribeConfirmedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdmin>
            <AdminShell />
          </ProtectedAdmin>
        }
      >
        <Route index element={<AdminOverviewPage />} />
        <Route path="library" element={<LibrarySection />} />
        <Route path="mdcat-res" element={<LibrarySection section="mdcat" />} />
        <Route path="messages" element={<MessagesSection />} />
        <Route path="subscribers" element={<SubscribersSection />} />
        <Route path="mdcat" element={<MdcatConfigSection />} />
      </Route>
    </Routes>
  );
}
