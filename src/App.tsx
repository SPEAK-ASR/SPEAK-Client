import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AdminGate } from "./components/layout/AdminGate";
import { LandingPage } from "./pages/LandingPage";
import { AudioProcessorPage } from "./pages/AudioProcessorPage";
import { QueueProcessorPage } from "./pages/QueueProcessorPage";
import { TranscriptionPage } from "./pages/TranscriptionPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { ChannelBrowserPage } from "./pages/ChannelBrowserPage";
import { CsvNormalizationPage } from "./pages/CsvNormalizationPage";
import { ValidationPage } from "./pages/ValidationPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="audio-processor" element={<AudioProcessorPage />} />
        <Route path="queue-processor" element={<QueueProcessorPage />} />
        <Route path="transcription" element={<TranscriptionPage />} />
        <Route
          path="validation"
          element={
            <AdminGate>
              <ValidationPage />
            </AdminGate>
          }
        />
        <Route
          path="leaderboard"
          element={
            <AdminGate>
              <LeaderboardPage />
            </AdminGate>
          }
        />
        <Route
          path="statistics"
          element={
            <AdminGate>
              <StatisticsPage />
            </AdminGate>
          }
        />
        <Route
          path="channels"
          element={
            <AdminGate>
              <ChannelBrowserPage />
            </AdminGate>
          }
        />
        <Route
          path="csv-normalization"
          element={<CsvNormalizationPage />}
        />
      </Route>
    </Routes>
  );
}
