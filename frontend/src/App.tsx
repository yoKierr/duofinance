import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './app/page'
import LoginPage from './app/login/page'
import RegisterPage from './app/register/page'
import ProfilePage from './app/profile/page'
import LearnPage from './app/learn/page'
import CoursesPage from './app/courses/page'
import LessonPage from './app/lesson/[id]/page'
import TestPage from './app/test/page'
import AchievementsPage from './app/achievements/page'
import ShopPage from './app/shop/page'
import SettingsPage from './app/settings/page'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  )
}