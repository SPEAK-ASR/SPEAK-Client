import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AudioProcessorPage } from "./pages/AudioProcessorPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { TranscriptionPage } from "./pages/TranscriptionPage";
import { ValidationPage } from "./pages/ValidationPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import ChannelBrowserPage from "./pages/ChannelBrowserPage";
import { QueueProcessorPage } from "./pages/QueueProcessorPage";

function App() {
    return (
        <Routes>
            <Route element={<AppLayout />}>
                <Route index element={<AudioProcessorPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="transcription" element={<TranscriptionPage />} />
                <Route path="validation" element={<ValidationPage />} />
                <Route path="leaderboard" element={<LeaderboardPage />} />
                <Route path="channels" element={<ChannelBrowserPage />} />
                <Route
                    path="queue-processor"
                    element={<QueueProcessorPage />}
                />
            </Route>
        </Routes>
    );
}

export default App;
