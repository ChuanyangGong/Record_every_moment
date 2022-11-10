import './App.css';
import MiniRecoder from './pages/MiniRecorder';
import { useCallback, useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import zhCN from 'antd/es/locale/zh_CN';
import { ConfigProvider } from 'antd';

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
    <ConfigProvider className="App" locale={zhCN}>
      {windowType === 'miniRecorder' && (<MiniRecoder />)}
      {windowType === 'dashboardWindow' && (<Dashboard />)}
    </ConfigProvider>
  );
}

export default App;
