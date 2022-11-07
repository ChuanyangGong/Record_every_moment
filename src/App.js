import logo from './logo.svg';
import './App.css';
import { Button } from 'antd';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Hello from Electron renderer!</h1>
        <p id="info">本应用正在使用 Chrome (v{window.versions.chrome()}), Node.js (v{window.versions.node()}), Electron (v{window.versions.node()})</p>
        Title: <input id="title"/>
        <Button type="primary">Set</Button>
        <button type="button" id="btn2">Open a File</button>
        File path: <strong id="filePath"></strong>
        <script src="./renderer.js"></script>
      </header>
    </div>
  );
}

export default App;
