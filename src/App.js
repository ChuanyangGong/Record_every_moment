import './App.css';
import MiniRecoder from './pages/MiniRecorder';
import { useCallback, useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';

function App() {

  const [windowType, setWindowType] = useState(null)

  const getWindowType = useCallback(async () => {
    if (windowType === null) {
      const res = await window.electronInit.getWindowType()
      setWindowType(res || null)
    }
  }, [windowType])

  useEffect(() => {
    getWindowType()
  }, [getWindowType])
  return (
    <div className="App">
      {windowType === 'miniRecorder' && (<MiniRecoder />)}
      {windowType === 'dashboardWindow' && (<Dashboard />)}
    </div>
  );
}

export default App;
