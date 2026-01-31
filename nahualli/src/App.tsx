import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './components/WalletProvider'
import { Landing } from './pages/Landing'
import { TestSelection } from './pages/TestSelection'
import { GenericAssessment } from './pages/GenericAssessment'
import { Proofs } from './pages/Proofs'
import { Interpretation } from './pages/Interpretation'
import { History } from './pages/History'
import { Verify } from './pages/Verify'
import { Docs } from './pages/Docs'

function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tests" element={<TestSelection />} />
          <Route path="/assessment" element={<Navigate to="/tests" replace />} />
          <Route path="/assessment/:testType" element={<GenericAssessment />} />
          <Route path="/proofs" element={<Proofs />} />
          <Route path="/interpretation" element={<Interpretation />} />
          <Route path="/history" element={<History />} />
          <Route path="/verify/:ipfsHash" element={<Verify />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/docs" element={<Docs />} />
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  )
}

export default App
